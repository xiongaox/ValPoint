/**
 * lineupImport - 点位导入服务
 * 
 * 职责：
 * - 解析 ValPoint 导出的 ZIP 压缩包
 * - 将压缩包内的图片上传到用户配置的图床
 * - 构建用于持久化的数据库 Payload
 */
import { unzipSync, strFromU8 } from 'fflate';
import { uploadImage } from './imageBed';
import { ImageBedConfig } from '../types/imageBed';
import { LineupDbPayload, LineupPosition, LineupSide } from '../types/lineup';

type LineupImageField = 'stand_img' | 'stand2_img' | 'aim_img' | 'aim2_img' | 'land_img';

// JSON payload format from exported ZIP
type LineupJsonPayload = {
    id: string;
    user_id: string | null;
    title: string;
    map_name: string;
    agent_name: string;
    agent_icon?: string | null;
    skill_icon?: string | null;
    side: string;
    ability_index: number | null;
    agent_pos: LineupPosition | null;
    skill_pos: LineupPosition | null;
    stand_img?: string | null;
    stand_desc?: string | null;
    stand2_img?: string | null;
    stand2_desc?: string | null;
    aim_img?: string | null;
    aim_desc?: string | null;
    aim2_img?: string | null;
    aim2_desc?: string | null;
    land_img?: string | null;
    land_desc?: string | null;
    source_link?: string | null;
    cloned_from?: string | null;
    author_name?: string | null;
    author_avatar?: string | null;
    author_uid?: string | null;
};

export type ImportProgress = {
    status: 'reading' | 'uploading' | 'done' | 'error';
    currentImage?: string;
    uploadedCount: number;
    totalImages: number;
    errorMessage?: string;
};

export type ImportResult = {
    success: boolean;
    payload?: LineupDbPayload;
    errorMessage?: string;
    failedImages: LineupImageField[];
};

// Metadata type for preview before import
export type ZipMetadata = {
    title: string;
    mapName: string;
    agentName: string;
    side: string;
};


/**
 * 解析 ZIP 文件元数据（用于预览，不上传图片）
 */
export const parseZipMetadata = async (zipFile: File): Promise<ZipMetadata> => {
    const arrayBuffer = await zipFile.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);
    const unzipped = unzipSync(zipData);

    // Find JSON file
    const jsonFileName = Object.keys(unzipped).find((name) => name.endsWith('.json'));
    if (!jsonFileName) {
        throw new Error('ZIP 文件中未找到 JSON 元数据');
    }

    // Parse JSON
    const jsonContent = strFromU8(unzipped[jsonFileName]);
    const jsonPayload: LineupJsonPayload = JSON.parse(jsonContent);

    return {
        title: jsonPayload.title,
        mapName: jsonPayload.map_name,
        agentName: jsonPayload.agent_name,
        side: jsonPayload.side,
    };
};

const imageSlots: { field: LineupImageField; fileName: string }[] = [
    { field: 'stand_img', fileName: '站位图.webp' },
    { field: 'stand2_img', fileName: '站位图2.webp' },
    { field: 'aim_img', fileName: '瞄点图.webp' },
    { field: 'aim2_img', fileName: '瞄点图2.webp' },
    { field: 'land_img', fileName: '技能落点图.webp' },
];

const isValidImageBedConfig = (config: ImageBedConfig): boolean => {
    if (!config?.provider) return false;
    // Check basic required fields based on provider
    if (config.provider === 'aliyun') {
        return !!(config.accessKeyId && config.accessKeySecret && config.bucket && config.area);
    }
    if (config.provider === 'tencent') {
        return !!(config.secretId && config.secretKey && config.bucket && config.area);
    }
    if (config.provider === 'qiniu') {
        return !!(config.accessKey && config.accessKeySecret && config.bucket && config.url);
    }
    return false;
};

/**
 * 解析并导入 ZIP 文件中的点位数据
 * @param zipFile 用户选择的 ZIP 文件
 * @param config 图床配置
 * @param userId 当前用户 ID
 * @param onProgress 进度回调
 */
export const importLineupFromZip = async (
    zipFile: File,
    config: ImageBedConfig,
    userId: string,
    onProgress?: (progress: ImportProgress) => void,
): Promise<ImportResult> => {
    const failedImages: LineupImageField[] = [];

    // Check image bed config
    if (!isValidImageBedConfig(config)) {
        return {
            success: false,
            errorMessage: '请先配置图床，才能导入点位',
            failedImages: [],
        };
    }

    try {
        // Read ZIP file
        onProgress?.({ status: 'reading', uploadedCount: 0, totalImages: 0 });
        const arrayBuffer = await zipFile.arrayBuffer();
        const zipData = new Uint8Array(arrayBuffer);
        const unzipped = unzipSync(zipData);

        // Find JSON file
        const jsonFileName = Object.keys(unzipped).find((name) => name.endsWith('.json'));
        if (!jsonFileName) {
            return { success: false, errorMessage: 'ZIP 文件中未找到 JSON 元数据', failedImages: [] };
        }

        // Parse JSON
        const jsonContent = strFromU8(unzipped[jsonFileName]);
        const jsonPayload: LineupJsonPayload = JSON.parse(jsonContent);

        // Collect images to upload
        const imagesToUpload: { field: LineupImageField; data: Uint8Array }[] = [];
        for (const slot of imageSlots) {
            const imagePath = `images/${slot.fileName}`;
            if (unzipped[imagePath]) {
                imagesToUpload.push({ field: slot.field, data: unzipped[imagePath] });
            }
        }

        // Upload images
        const uploadedUrls: Partial<Record<LineupImageField, string>> = {};
        const totalImages = imagesToUpload.length;

        for (let i = 0; i < imagesToUpload.length; i++) {
            const { field, data } = imagesToUpload[i];
            onProgress?.({
                status: 'uploading',
                currentImage: field,
                uploadedCount: i,
                totalImages,
            });

            try {
                const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
                const blob = new Blob([arrayBuffer], { type: 'image/webp' });
                const file = new File([blob], `${field}.webp`, { type: 'image/webp' });
                const result = await uploadImage(file, config);
                uploadedUrls[field] = result.url;
            } catch (error) {
                console.error(`Failed to upload ${field}:`, error);
                failedImages.push(field);
            }
        }

        // Build payload for database
        const payload: LineupDbPayload = {
            title: jsonPayload.title,
            map_name: jsonPayload.map_name,
            agent_name: jsonPayload.agent_name,
            agent_icon: jsonPayload.agent_icon ?? null,
            skill_icon: jsonPayload.skill_icon ?? null,
            side: jsonPayload.side as LineupSide,
            ability_index: jsonPayload.ability_index,
            agent_pos: jsonPayload.agent_pos,
            skill_pos: jsonPayload.skill_pos,
            stand_img: uploadedUrls.stand_img ?? jsonPayload.stand_img ?? null,
            stand_desc: jsonPayload.stand_desc ?? null,
            stand2_img: uploadedUrls.stand2_img ?? jsonPayload.stand2_img ?? null,
            stand2_desc: jsonPayload.stand2_desc ?? null,
            aim_img: uploadedUrls.aim_img ?? jsonPayload.aim_img ?? null,
            aim_desc: jsonPayload.aim_desc ?? null,
            aim2_img: uploadedUrls.aim2_img ?? jsonPayload.aim2_img ?? null,
            aim2_desc: jsonPayload.aim2_desc ?? null,
            land_img: uploadedUrls.land_img ?? jsonPayload.land_img ?? null,
            land_desc: jsonPayload.land_desc ?? null,
            source_link: jsonPayload.source_link ?? null,
            author_name: jsonPayload.author_name ?? null,
            author_avatar: jsonPayload.author_avatar ?? null,
            author_uid: jsonPayload.author_uid ?? null,
            user_id: userId,
            cloned_from: jsonPayload.id, // Use original ID as cloned_from reference
            created_at: new Date().toISOString(),
        };

        onProgress?.({ status: 'done', uploadedCount: totalImages, totalImages });

        return { success: true, payload, failedImages };
    } catch (error) {
        const message = error instanceof Error ? error.message : '导入失败';
        onProgress?.({ status: 'error', uploadedCount: 0, totalImages: 0, errorMessage: message });
        return { success: false, errorMessage: message, failedImages };
    }
};
