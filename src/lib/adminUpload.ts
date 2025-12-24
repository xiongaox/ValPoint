/**
 * 管理员点位上传服务
 * 跳过审核流程，直接上传到 OSS 并写入 valorant_shared 表
 */

import { unzipSync, strFromU8 } from 'fflate';
import { shareSupabase } from '../supabaseClient';
import { ImageBedConfig } from '../types/imageBed';
import { uploadImage } from './imageBed';
import { TABLE } from '../services/tables';

/** ZIP 解析后的图片数据 */
interface ParsedZipData {
    jsonPayload: any;
    images: Map<string, Uint8Array>;
}

/** 上传进度 */
export interface AdminUploadProgress {
    status: 'parsing' | 'uploading' | 'saving' | 'done' | 'error';
    current: number;
    total: number;
    currentFile?: string;
    errorMessage?: string;
}

/** 上传结果 */
export interface AdminUploadResult {
    success: boolean;
    shareId?: string;
    errorMessage?: string;
}

/** 图片字段映射 */
const IMAGE_FIELDS = [
    { jsonKey: 'stand_img', field: 'stand_img' },
    { jsonKey: 'aim_img', field: 'aim_img' },
    { jsonKey: 'aim2_img', field: 'aim2_img' },
    { jsonKey: 'land_img', field: 'land_img' },
] as const;

/**
 * 解析 ZIP 文件
 */
export const parseZipFile = async (zipFile: File): Promise<ParsedZipData> => {
    const arrayBuffer = await zipFile.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);
    const unzipped = unzipSync(zipData);

    // 查找 JSON 文件
    const jsonFileName = Object.keys(unzipped).find((name) => name.endsWith('.json'));
    if (!jsonFileName) {
        throw new Error('ZIP 文件中未找到 JSON 元数据');
    }

    // 解析 JSON
    const jsonContent = strFromU8(unzipped[jsonFileName]);
    const jsonPayload = JSON.parse(jsonContent);

    // 收集图片文件
    const images = new Map<string, Uint8Array>();
    for (const [fileName, data] of Object.entries(unzipped)) {
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
            images.set(fileName, data as Uint8Array);
        }
    }

    return { jsonPayload, images };
};

/**
 * 从 ZIP 文件预解析元数据（用于预览）
 */
export const parseZipMetadata = async (zipFile: File): Promise<{
    title: string;
    mapName: string;
    agentName: string;
    side: 'attack' | 'defense';
    imageCount: number;
} | null> => {
    try {
        const { jsonPayload, images } = await parseZipFile(zipFile);
        return {
            title: jsonPayload.title || '未命名点位',
            mapName: jsonPayload.map_name || '未知',
            agentName: jsonPayload.agent_name || '未知',
            side: jsonPayload.side || 'attack',
            imageCount: images.size,
        };
    } catch {
        return null;
    }
};

/**
 * 管理员直接上传点位到共享库
 * 跳过审核流程，图片直接上传到 OSS
 */
export const adminUploadLineup = async (
    zipFile: File,
    adminEmail: string,
    ossConfig: ImageBedConfig,
    onProgress?: (progress: AdminUploadProgress) => void,
): Promise<AdminUploadResult> => {
    try {
        onProgress?.({ status: 'parsing', current: 0, total: 0 });

        // 1. 解析 ZIP 文件
        const { jsonPayload, images } = await parseZipFile(zipFile);
        const totalImages = images.size;

        // 2. 上传图片到 OSS
        const imageUrls: Record<string, string> = {};
        let uploadedCount = 0;

        for (const field of IMAGE_FIELDS) {
            const imageFileName = jsonPayload[field.jsonKey];
            if (imageFileName && images.has(imageFileName)) {
                onProgress?.({
                    status: 'uploading',
                    current: uploadedCount,
                    total: totalImages,
                    currentFile: imageFileName,
                });

                const imageData = images.get(imageFileName)!;
                const ext = imageFileName.split('.').pop()?.toLowerCase() || 'jpg';

                // 转换为 Blob
                const mimeTypes: Record<string, string> = {
                    jpg: 'image/jpeg',
                    jpeg: 'image/jpeg',
                    png: 'image/png',
                    gif: 'image/gif',
                    webp: 'image/webp',
                };
                const blob = new Blob([new Uint8Array(imageData)], { type: mimeTypes[ext] || 'image/jpeg' });

                // 上传到 OSS
                try {
                    const result = await uploadImage(blob, ossConfig, {
                        extensionHint: ext,
                    });
                    imageUrls[field.field] = result.url;
                } catch (uploadError) {
                    console.error(`上传图片失败 (${field.field}):`, uploadError);
                }

                uploadedCount++;
            }
        }

        onProgress?.({ status: 'saving', current: uploadedCount, total: totalImages });

        // 3. 直接写入 valorant_shared 表
        const shareId = crypto.randomUUID().replace(/-/g, '').substring(0, 12);

        const sharedLineup = {
            share_id: shareId,
            title: jsonPayload.title || '未命名点位',
            map_name: jsonPayload.map_name,
            agent_name: jsonPayload.agent_name,
            agent_icon: jsonPayload.agent_icon,
            skill_icon: jsonPayload.skill_icon,
            side: jsonPayload.side || 'attack',
            ability_index: jsonPayload.ability_index,
            agent_pos: jsonPayload.agent_pos,
            skill_pos: jsonPayload.skill_pos,
            stand_img: imageUrls.stand_img,
            stand_desc: jsonPayload.stand_desc,
            stand2_img: imageUrls.stand2_img,
            stand2_desc: jsonPayload.stand2_desc,
            aim_img: imageUrls.aim_img,
            aim_desc: jsonPayload.aim_desc,
            aim2_img: imageUrls.aim2_img,
            aim2_desc: jsonPayload.aim2_desc,
            land_img: imageUrls.land_img,
            land_desc: jsonPayload.land_desc,
            source_link: jsonPayload.source_link,
            user_id: adminEmail || 'admin',
        };

        const { error } = await shareSupabase.from(TABLE.shared).insert(sharedLineup);

        if (error) {
            throw new Error(`保存点位失败: ${error.message}`);
        }

        onProgress?.({ status: 'done', current: uploadedCount, total: totalImages });

        return {
            success: true,
            shareId,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : '上传失败';
        onProgress?.({ status: 'error', current: 0, total: 0, errorMessage: message });
        return {
            success: false,
            errorMessage: message,
        };
    }
};

/**
 * 批量上传多个 ZIP 文件
 */
export const adminUploadMultiple = async (
    zipFiles: File[],
    adminEmail: string,
    ossConfig: ImageBedConfig,
    onProgress?: (fileIndex: number, total: number, progress: AdminUploadProgress) => void,
): Promise<{ success: number; failed: number; errors: string[] }> => {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < zipFiles.length; i++) {
        const file = zipFiles[i];
        const result = await adminUploadLineup(
            file,
            adminEmail,
            ossConfig,
            (progress) => onProgress?.(i, zipFiles.length, progress),
        );

        if (result.success) {
            success++;
        } else {
            failed++;
            errors.push(`${file.name}: ${result.errorMessage}`);
        }
    }

    return { success, failed, errors };
};
