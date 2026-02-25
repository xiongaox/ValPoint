/**
 * submissionUpload - 基础库
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
 * - `parseSubmissionZip`、`checkDailySubmissionLimit`、`submitLineup`、`submitLineupDirectly`、`getUserSubmissions`、`deleteSubmission`
 *
 * 依赖关系：
 * - 上游依赖：`fflate`、`../supabaseClient`、`../types/submission`
 * - 下游影响：供 hooks/features/services 复用
 */

import { unzipSync, strFromU8 } from 'fflate';
import { supabase } from '../supabaseClient';
import { SubmissionFormData, SubmissionProgress, SubmissionResult, LineupSubmission } from '../types/submission';

interface ParsedZipData {
    jsonPayload: any;
    images: Map<string, Uint8Array>; // 说明：文件名到二进制数据的映射。
}

const IMAGE_FIELDS = [
    { jsonKey: 'stand_img', field: 'stand_img' },
    { jsonKey: 'aim_img', field: 'aim_img' },
    { jsonKey: 'aim2_img', field: 'aim2_img' },
    { jsonKey: 'land_img', field: 'land_img' },
] as const;

export const parseSubmissionZip = async (zipFile: File): Promise<ParsedZipData> => {
    const arrayBuffer = await zipFile.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);
    const unzipped = unzipSync(zipData);

    const jsonFileName = Object.keys(unzipped).find((name) => name.endsWith('.json'));
    if (!jsonFileName) {
        throw new Error('ZIP 文件中未找到 JSON 元数据');
    }

    const jsonContent = strFromU8(unzipped[jsonFileName]);
    const jsonPayload = JSON.parse(jsonContent);

    const images = new Map<string, Uint8Array>();
    for (const [fileName, data] of Object.entries(unzipped)) {
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
            images.set(fileName, data as Uint8Array);
        }
    }

    return { jsonPayload, images };
};

const uploadImageToStorage = async (
    imageData: Uint8Array,
    fileName: string,
    submissionId: string,
    userId: string,
): Promise<string> => {
    const bucket = 'submissions';

    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const safeFileName = `${crypto.randomUUID()}.${ext}`;
    const path = `${userId}/${submissionId}/${safeFileName}`;

    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';

    const blob = new Blob([new Uint8Array(imageData)], { type: contentType });

    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
        contentType,
        upsert: true,
    });

    if (error) {
        throw new Error(`上传图片失败: ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
};

export const checkDailySubmissionLimit = async (userId: string): Promise<{ allowed: boolean; remaining: number }> => {
    const { data: settings } = await supabase
        .from('system_settings')
        .select('daily_submission_limit')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

    const limit = settings?.daily_submission_limit || 10;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
        .from('lineup_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('submitter_id', userId)
        .gte('created_at', today.toISOString());

    const todayCount = count || 0;
    const remaining = Math.max(0, limit - todayCount);

    return {
        allowed: todayCount < limit,
        remaining,
    };
};

export const submitLineup = async (
    zipFile: File,
    userId: string,
    userEmail: string | undefined,
    onProgress?: (progress: SubmissionProgress) => void,
): Promise<SubmissionResult> => {
    try {
        const { allowed, remaining } = await checkDailySubmissionLimit(userId);
        if (!allowed) {
            return {
                success: false,
                errorMessage: `今日投稿次数已达上限，请明天再试`,
            };
        }

        onProgress?.({ status: 'uploading', uploadedCount: 0, totalImages: 0 });

        const { jsonPayload, images } = await parseSubmissionZip(zipFile);
        const totalImages = images.size;

        const submissionId = crypto.randomUUID();

        const imageUrls: Record<string, string> = {};
        let uploadedCount = 0;

        for (const field of IMAGE_FIELDS) {
            const imageFileName = jsonPayload[field.jsonKey];
            if (imageFileName && images.has(imageFileName)) {
                const imageData = images.get(imageFileName)!;
                const url = await uploadImageToStorage(imageData, imageFileName, submissionId, userId);
                imageUrls[field.field] = url;
                uploadedCount++;
                onProgress?.({ status: 'uploading', uploadedCount, totalImages });
            }
        }

        onProgress?.({ status: 'saving', uploadedCount, totalImages });

        const submissionData: Partial<LineupSubmission> = {
            id: submissionId,
            submitter_id: userId,
            submitter_email: userEmail,
            title: jsonPayload.title || '未命名点位',
            map_name: jsonPayload.map_name,
            agent_name: jsonPayload.agent_name,
            agent_icon: jsonPayload.agent_icon,
            skill_icon: jsonPayload.skill_icon,
            side: jsonPayload.side || 'attack',
            ability_index: jsonPayload.ability_index,
            agent_pos: jsonPayload.agent_pos,
            skill_pos: jsonPayload.skill_pos,
            description: jsonPayload.description,
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
            author_name: jsonPayload.author_name,
            author_avatar: jsonPayload.author_avatar,
            author_uid: jsonPayload.author_uid,
            status: 'pending',
        };

        const { error } = await supabase.from('lineup_submissions').insert(submissionData);

        if (error) {
            throw new Error(`保存投稿失败: ${error.message}`);
        }

        onProgress?.({ status: 'done', uploadedCount, totalImages });

        return {
            success: true,
            submissionId,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : '投稿失败';
        onProgress?.({ status: 'error', uploadedCount: 0, totalImages: 0, errorMessage: message });
        return {
            success: false,
            errorMessage: message,
        };
    }
};

const downloadImageAsBuffer = async (imageUrl: string): Promise<{ data: Uint8Array; ext: string } | null> => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            console.warn(`下载图片失败: ${imageUrl}`, response.status);
            return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);

        const contentType = response.headers.get('content-type') || '';
        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('gif')) ext = 'gif';
        else {
            const urlExt = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
            if (urlExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExt)) {
                ext = urlExt === 'jpeg' ? 'jpg' : urlExt;
            }
        }

        return { data, ext };
    } catch (error) {
        console.error(`下载图片异常: ${imageUrl}`, error);
        return null;
    }
};

export const submitLineupDirectly = async (
    lineup: {
        id: string;
        title: string;
        mapName: string;
        agentName: string;
        agentIcon?: string | null;
        skillIcon?: string | null;
        side: 'attack' | 'defense';
        abilityIndex?: number | null;
        agentPos?: { lat: number; lng: number } | null;
        skillPos?: { lat: number; lng: number } | null;
        standImg?: string | null;
        standDesc?: string | null;
        stand2Img?: string | null;
        stand2Desc?: string | null;
        aimImg?: string | null;
        aimDesc?: string | null;
        aim2Img?: string | null;
        aim2Desc?: string | null;
        landImg?: string | null;
        landDesc?: string | null;
        sourceLink?: string | null;
        authorName?: string | null;
        authorAvatar?: string | null;
        authorUid?: string | null;
    },
    userId: string,
    userEmail: string | undefined,
    onProgress?: (progress: SubmissionProgress) => void,
): Promise<SubmissionResult> => {
    try {
        const { allowed } = await checkDailySubmissionLimit(userId);
        if (!allowed) {
            return {
                success: false,
                errorMessage: `今日投稿次数已达上限，请明天再试`,
            };
        }

        const imageFields = [
            { key: 'stand_img', url: lineup.standImg },
            { key: 'stand2_img', url: lineup.stand2Img },
            { key: 'aim_img', url: lineup.aimImg },
            { key: 'aim2_img', url: lineup.aim2Img },
            { key: 'land_img', url: lineup.landImg },
        ].filter((f) => f.url);

        const totalImages = imageFields.length;
        onProgress?.({ status: 'uploading', uploadedCount: 0, totalImages });

        const submissionId = crypto.randomUUID();

        const imageUrls: Record<string, string> = {};
        let uploadedCount = 0;

        for (const field of imageFields) {
            if (!field.url) continue;

            const downloaded = await downloadImageAsBuffer(field.url);
            if (downloaded) {
                const fileName = `${field.key}.${downloaded.ext}`;
                const newUrl = await uploadImageToStorage(downloaded.data, fileName, submissionId, userId);
                imageUrls[field.key] = newUrl;
            }
            uploadedCount++;
            onProgress?.({ status: 'uploading', uploadedCount, totalImages });
        }

        onProgress?.({ status: 'saving', uploadedCount, totalImages });

        const submissionData: Partial<LineupSubmission> = {
            id: submissionId,
            submitter_id: userId,
            submitter_email: userEmail,
            title: lineup.title || '未命名点位',
            map_name: lineup.mapName,
            agent_name: lineup.agentName,
            agent_icon: lineup.agentIcon || undefined,
            skill_icon: lineup.skillIcon || undefined,
            side: lineup.side,
            ability_index: lineup.abilityIndex || undefined,
            agent_pos: lineup.agentPos || undefined,
            skill_pos: lineup.skillPos || undefined,
            stand_img: imageUrls.stand_img,
            stand_desc: lineup.standDesc || undefined,
            stand2_img: imageUrls.stand2_img,
            stand2_desc: lineup.stand2Desc || undefined,
            aim_img: imageUrls.aim_img,
            aim_desc: lineup.aimDesc || undefined,
            aim2_img: imageUrls.aim2_img,
            aim2_desc: lineup.aim2Desc || undefined,
            land_img: imageUrls.land_img,
            land_desc: lineup.landDesc || undefined,
            source_link: lineup.sourceLink || undefined,
            author_name: lineup.authorName || undefined,
            author_avatar: lineup.authorAvatar || undefined,
            author_uid: lineup.authorUid || undefined,
            status: 'pending',
        };

        const { error } = await supabase.from('lineup_submissions').insert(submissionData);

        if (error) {
            throw new Error(`保存投稿失败: ${error.message}`);
        }

        onProgress?.({ status: 'done', uploadedCount, totalImages });

        return {
            success: true,
            submissionId,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : '投稿失败';
        onProgress?.({ status: 'error', uploadedCount: 0, totalImages: 0, errorMessage: message });
        return {
            success: false,
            errorMessage: message,
        };
    }
};

export const getUserSubmissions = async (userId: string): Promise<LineupSubmission[]> => {
    const { data, error } = await supabase
        .from('lineup_submissions')
        .select('*')
        .eq('submitter_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('获取投稿列表失败:', error);
        return [];
    }

    return data || [];
};

export const deleteSubmission = async (submissionId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
    const { data: submission, error: fetchError } = await supabase
        .from('lineup_submissions')
        .select('status, submitter_id')
        .eq('id', submissionId)
        .single();

    if (fetchError || !submission) {
        return { success: false, error: '找不到该投稿记录' };
    }

    if (submission.submitter_id !== userId) {
        return { success: false, error: '无权删除他人的投稿' };
    }

    if (submission.status === 'pending') {
        return { success: false, error: '审核中的投稿不能删除，请先取消审核' };
    }

    const { error } = await supabase
        .from('lineup_submissions')
        .delete()
        .eq('id', submissionId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
};

export const cancelSubmission = async (submissionId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
    const { data: submission, error: fetchError } = await supabase
        .from('lineup_submissions')
        .select('status, submitter_id')
        .eq('id', submissionId)
        .single();

    if (fetchError || !submission) {
        return { success: false, error: '找不到该投稿记录' };
    }

    if (submission.submitter_id !== userId) {
        return { success: false, error: '无权取消他人的投稿' };
    }

    if (submission.status !== 'pending') {
        return { success: false, error: '只能取消审核中的投稿' };
    }

    const { error } = await supabase
        .from('lineup_submissions')
        .update({ status: 'rejected', reject_reason: '用户主动取消' })
        .eq('id', submissionId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
};

export const deleteSubmissionsByStatus = async (
    userId: string,
    statusFilter: 'all' | 'approved' | 'rejected'
): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
    let countQuery = supabase
        .from('lineup_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('submitter_id', userId)
        .neq('status', 'pending');

    if (statusFilter === 'approved') {
        countQuery = countQuery.eq('status', 'approved');
    } else if (statusFilter === 'rejected') {
        countQuery = countQuery.eq('status', 'rejected');
    }

    const { count } = await countQuery;

    let deleteQuery = supabase
        .from('lineup_submissions')
        .delete()
        .eq('submitter_id', userId)
        .neq('status', 'pending');

    if (statusFilter === 'approved') {
        deleteQuery = deleteQuery.eq('status', 'approved');
    } else if (statusFilter === 'rejected') {
        deleteQuery = deleteQuery.eq('status', 'rejected');
    }

    const { error } = await deleteQuery;

    if (error) {
        return { success: false, deletedCount: 0, error: error.message };
    }

    return { success: true, deletedCount: count || 0 };
};
