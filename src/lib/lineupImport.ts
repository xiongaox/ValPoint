/**
 * lineupImport - 基础库
 *
 * 模块定位：
 * - 所在层级：基础库
 * - 主要目标：提供通用工具能力与系统辅助逻辑
 *
 * 关键职责：
 * - 提供与框架解耦的通用能力函数
 * - 处理下载、导入、校验、系统配置等基础逻辑
 * - 为业务层提供可组合的底层能力
 *
 * 主要导出：
 * - `ImportProgress`、`ImportResult`、`ZipMetadata`、`parseZipMetadata`、`importLineupFromZip`
 *
 * 依赖关系：
 * - 上游依赖：`fflate`、`./imageBed`、`../types/imageBed`、`../types/lineup`
 * - 下游影响：供 hooks/features/services 复用
 */

import { unzipSync, strFromU8 } from 'fflate';
import { uploadImage } from './imageBed';
import { ImageBedConfig } from '../types/imageBed';
import { LineupDbPayload, LineupPosition, LineupSide, BaseLineup } from '../types/lineup';
import { generateUniqueTitle } from '../features/lineups/lineupHelpers';

type LineupImageField = 'stand_img' | 'stand2_img' | 'aim_img' | 'aim2_img' | 'land_img';

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
    creator_id?: string | null;
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

export type ZipMetadata = {
    title: string;
    mapName: string;
    agentName: string;
    side: string;
};


export const parseZipMetadata = async (zipFile: File): Promise<ZipMetadata> => {
    const arrayBuffer = await zipFile.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);
    const unzipped = unzipSync(zipData);

    const jsonFileName = Object.keys(unzipped).find((name) => name.endsWith('.json'));
    if (!jsonFileName) {
        throw new Error('ZIP 文件中未找到 JSON 元数据');
    }

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

export const importLineupFromZip = async (
    zipFile: File,
    config: ImageBedConfig,
    userId: string,
    existingLineups: BaseLineup[],
    onProgress?: (progress: ImportProgress) => void,
): Promise<ImportResult> => {
    const failedImages: LineupImageField[] = [];

    if (!isValidImageBedConfig(config)) {
        return {
            success: false,
            errorMessage: '请先配置图床，才能导入点位',
            failedImages: [],
        };
    }

    try {
        onProgress?.({ status: 'reading', uploadedCount: 0, totalImages: 0 });
        const arrayBuffer = await zipFile.arrayBuffer();
        const zipData = new Uint8Array(arrayBuffer);
        const unzipped = unzipSync(zipData);

        const jsonFileName = Object.keys(unzipped).find((name) => name.endsWith('.json'));
        if (!jsonFileName) {
            return { success: false, errorMessage: 'ZIP 文件中未找到 JSON 元数据', failedImages: [] };
        }

        const jsonContent = strFromU8(unzipped[jsonFileName]);
        const jsonPayload: LineupJsonPayload = JSON.parse(jsonContent);

        const imagesToUpload: { field: LineupImageField; data: Uint8Array }[] = [];
        for (const slot of imageSlots) {
            const imagePath = `images/${slot.fileName}`;
            if (unzipped[imagePath]) {
                imagesToUpload.push({ field: slot.field, data: unzipped[imagePath] });
            }
        }

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

        const uniqueTitle = generateUniqueTitle(jsonPayload.title, existingLineups, jsonPayload.agent_name);
        const payload: LineupDbPayload = {
            title: uniqueTitle,
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
            creator_id: jsonPayload.creator_id ?? null,
            user_id: userId,
            cloned_from: jsonPayload.id, // 说明：使用原始 ID 作为 cloned_from。
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
