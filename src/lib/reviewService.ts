/**
 * reviewService - 投稿审核流程服务
 * 
 * 职责：
 * - 管理用户提交的待审点位（获取列表、批准、拒绝）
 * - 批准时自动将图片从临时存储迁移到官方 OSS
 * - 联动更新共享库数据并清理临时资源
 */
import { supabase, shareSupabase, adminSupabase } from '../supabaseClient';
import { LineupSubmission } from '../types/submission';
import { ImageBedConfig } from '../types/imageBed';
import { transferImage } from './imageBed';
import { TABLE } from '../services/tables';

/** 获取所有待审投稿 */
export async function getPendingSubmissions(): Promise<LineupSubmission[]> {
    const { data, error } = await adminSupabase
        .from('lineup_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('获取待审投稿失败:', error);
        return [];
    }
    return data || [];
}

/** 获取所有投稿（包括已审核的） */
export async function getAllSubmissions(): Promise<LineupSubmission[]> {
    const { data, error } = await adminSupabase
        .from('lineup_submissions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('获取投稿列表失败:', error);
        return [];
    }
    return data || [];
}

/** 图片字段映射 */
const IMAGE_FIELDS = ['stand_img', 'stand2_img', 'aim_img', 'aim2_img', 'land_img'] as const;

/**
 * 迁移图片到官方图床
 * 将 Supabase Storage 中的临时图片转存到官方 OSS
 */
async function migrateImagesToOss(
    submission: LineupSubmission,
    ossConfig: ImageBedConfig,
): Promise<Partial<LineupSubmission>> {
    const migratedUrls: Partial<LineupSubmission> = {};

    for (const field of IMAGE_FIELDS) {
        const sourceUrl = submission[field];
        if (!sourceUrl) continue;

        try {
            const newUrl = await transferImage(sourceUrl, ossConfig);
            migratedUrls[field] = newUrl;
        } catch (error) {
            console.error(`迁移图片失败 (${field}):`, error);
            // 保留原 URL，不中断流程
            migratedUrls[field] = sourceUrl;
        }
    }

    return migratedUrls;
}

/**
 * 审核通过
 * 1. 迁移图片到官方 OSS
 * 2. 创建 shared_lineups 记录
 * 3. 更新投稿状态
 * 4. 删除 Supabase Storage 临时文件
 */
export async function approveSubmission(
    submission: LineupSubmission,
    reviewerId: string,
    ossConfig: ImageBedConfig,
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. 迁移图片到官方 OSS
        const migratedUrls = await migrateImagesToOss(submission, ossConfig);

        // 2. 创建 valorant_shared 记录
        // 生成 UUID 作为 id
        const newId = crypto.randomUUID();

        const sharedLineup = {
            id: newId,
            source_id: submission.id,
            title: submission.title,
            map_name: submission.map_name,
            agent_name: submission.agent_name,
            agent_icon: submission.agent_icon,
            skill_icon: submission.skill_icon,
            side: submission.side,
            ability_index: submission.ability_index,
            agent_pos: submission.agent_pos,
            skill_pos: submission.skill_pos,
            stand_img: migratedUrls.stand_img || submission.stand_img,
            stand_desc: submission.stand_desc,
            stand2_img: migratedUrls.stand2_img || submission.stand2_img,
            stand2_desc: submission.stand2_desc,
            aim_img: migratedUrls.aim_img || submission.aim_img,
            aim_desc: submission.aim_desc,
            aim2_img: migratedUrls.aim2_img || submission.aim2_img,
            aim2_desc: submission.aim2_desc,
            land_img: migratedUrls.land_img || submission.land_img,
            land_desc: submission.land_desc,
            source_link: submission.source_link,
            author_name: submission.author_name,
            author_avatar: submission.author_avatar,
            author_uid: submission.submitter_email || `user_${submission.submitter_id.substring(0, 8)}`,
        };

        const { error: insertError } = await adminSupabase
            .from(TABLE.shared)
            .insert(sharedLineup);

        if (insertError) {
            return { success: false, error: `创建共享点位失败: ${insertError.message}` };
        }

        // 3. 更新投稿状态
        const { error: updateError } = await adminSupabase
            .from('lineup_submissions')
            .update({
                status: 'approved',
                reviewed_by: reviewerId,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', submission.id);

        if (updateError) {
            return { success: false, error: `更新投稿状态失败: ${updateError.message}` };
        }

        // 4. 清理 Supabase Storage 中的临时图片
        await deleteSubmissionImages(submission);

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : '审核失败';
        return { success: false, error: message };
    }
}

/**
 * 审核拒绝
 * ... (unchanged)
 */
export async function rejectSubmission(
    submissionId: string,
    reviewerId: string,
    reason: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. 获取投稿信息用于后续清理
        const { data: submission, error: fetchError } = await adminSupabase
            .from('lineup_submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (fetchError || !submission) {
            return { success: false, error: '找不到该投稿记录' };
        }

        // 2. 更新投稿状态
        const { error } = await adminSupabase
            .from('lineup_submissions')
            .update({
                status: 'rejected',
                reject_reason: reason,
                reviewed_by: reviewerId,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', submissionId);

        if (error) {
            return { success: false, error: error.message };
        }

        // 3. 清理临时图片
        await deleteSubmissionImages(submission as LineupSubmission);

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : '拒绝失败';
        return { success: false, error: message };
    }
}

/**
 * 删除投稿的临时图片
 * ... (unchanged)
 */
export async function deleteSubmissionImages(submission: LineupSubmission): Promise<void> {
    const bucket = 'submissions';
    const basePath = `${submission.submitter_id}/${submission.id}`;

    try {
        const { data: files } = await adminSupabase.storage.from(bucket).list(basePath);
        if (files && files.length > 0) {
            const paths = files.map((f) => `${basePath}/${f.name}`);
            await adminSupabase.storage.from(bucket).remove(paths);
        }
    } catch (error) {
        console.error('删除临时文件失败:', error);
    }
}

/** 共享库点位类型 */
export interface SharedLineup {
    id: string; // 使用 id
    source_id?: string;
    user_id?: string;
    title: string;
    map_name: string;
    agent_name: string;
    agent_icon?: string;
    skill_icon?: string;
    side: string;
    created_at: string;
    updated_at: string;
}

/** 获取共享库所有点位 */
export async function getSharedLineups(): Promise<SharedLineup[]> {
    const { data, error } = await adminSupabase
        .from(TABLE.shared)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('获取共享库点位失败:', error);
        return [];
    }
    return data || [];
}

/** 删除共享库点位 */
export async function deleteSharedLineup(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await adminSupabase
        .from(TABLE.shared)
        .delete()
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true };
}
