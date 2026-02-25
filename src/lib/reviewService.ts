/**
 * reviewService - 基础库
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
 * - `SharedLineup`
 *
 * 依赖关系：
 * - 上游依赖：`../supabaseClient`、`../types/submission`、`../types/imageBed`、`./imageBed`
 * - 下游影响：供 hooks/features/services 复用
 */

import { supabase, shareSupabase, adminSupabase } from '../supabaseClient';
import { LineupSubmission } from '../types/submission';
import { ImageBedConfig } from '../types/imageBed';
import { transferImage } from './imageBed';
import { TABLE } from '../services/tables';

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

const IMAGE_FIELDS = ['stand_img', 'stand2_img', 'aim_img', 'aim2_img', 'land_img'] as const;

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
            migratedUrls[field] = sourceUrl;
        }
    }

    return migratedUrls;
}

export async function approveSubmission(
    submission: LineupSubmission,
    reviewerId: string,
    ossConfig: ImageBedConfig,
): Promise<{ success: boolean; error?: string }> {
    try {
        const migratedUrls = await migrateImagesToOss(submission, ossConfig);

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
            author_uid: submission.author_uid, // 投稿者自定义 ID (如 VALPOINT)
        };

        // 查询投稿者的 custom_id 作为 creator_id
        let creatorId: string | null = null;
        try {
            const { data: profile } = await adminSupabase
                .from('user_profiles')
                .select('custom_id')
                .eq('id', submission.submitter_id)
                .single();
            creatorId = profile?.custom_id || null;
        } catch (e) {
            console.warn('获取投稿者 custom_id 失败:', e);
        }

        // @ts-ignore
        sharedLineup.creator_id = creatorId;

        const { error: insertError } = await adminSupabase
            .from(TABLE.shared)
            .insert(sharedLineup);

        if (insertError) {
            return { success: false, error: `创建共享点位失败: ${insertError.message}` };
        }

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

        await deleteSubmissionImages(submission);

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : '审核失败';
        return { success: false, error: message };
    }
}

export async function rejectSubmission(
    submissionId: string,
    reviewerId: string,
    reason: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: submission, error: fetchError } = await adminSupabase
            .from('lineup_submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (fetchError || !submission) {
            return { success: false, error: '找不到该投稿记录' };
        }

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

        await deleteSubmissionImages(submission as LineupSubmission);

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : '拒绝失败';
        return { success: false, error: message };
    }
}

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

export interface SharedLineup {
    id: string; // 说明：使用 id。
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

export async function deleteSharedLineups(ids: string[]): Promise<{ success: boolean; error?: string }> {
    const { error } = await adminSupabase
        .from(TABLE.shared)
        .delete()
        .in('id', ids);

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true };
}
