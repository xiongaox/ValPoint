/**
 * 投稿点位类型定义
 */

/** 投稿状态 */
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

/** 点位坐标 */
export interface LineupPosition {
    lat: number;
    lng: number;
}

/** 投稿点位数据 */
/**
 * submission.ts - 投稿审核流数据类型定义
 */
export interface LineupSubmission {
    id: string;
    // 投稿者信息
    submitter_id: string;
    submitter_email?: string;
    // 点位基础信息
    title: string;
    map_name: string;
    agent_name: string;
    agent_icon?: string;
    skill_icon?: string;
    side: 'attack' | 'defense';
    ability_index?: number;
    agent_pos?: LineupPosition;
    skill_pos?: LineupPosition;
    description?: string;
    // 图片链接 (存储在 Supabase Storage)
    stand_img?: string;
    stand_desc?: string;
    stand2_img?: string;
    stand2_desc?: string;
    aim_img?: string;
    aim_desc?: string;
    aim2_img?: string;
    aim2_desc?: string;
    land_img?: string;
    land_desc?: string;
    // 来源信息
    source_link?: string;
    author_name?: string;
    author_avatar?: string;
    author_uid?: string;
    // 审核状态
    status: SubmissionStatus;
    reject_reason?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    // 时间戳
    created_at: string;
    updated_at: string;
}

/** 投稿表单数据（创建时使用） */
export interface SubmissionFormData {
    title: string;
    map_name: string;
    agent_name: string;
    agent_icon?: string;
    skill_icon?: string;
    side: 'attack' | 'defense';
    ability_index?: number;
    agent_pos?: LineupPosition;
    skill_pos?: LineupPosition;
    description?: string;
    // 图片文件（待上传到 Supabase Storage）
    stand_img?: string;
    stand_desc?: string;
    aim_img?: string;
    aim_desc?: string;
    aim2_img?: string;
    aim2_desc?: string;
    land_img?: string;
    land_desc?: string;
    // 来源信息
    source_link?: string;
    author_name?: string;
    author_avatar?: string;
    author_uid?: string;
}

/** 投稿进度 */
export interface SubmissionProgress {
    status: 'uploading' | 'saving' | 'done' | 'error';
    uploadedCount: number;
    totalImages: number;
    errorMessage?: string;
}

/** 投稿结果 */
export interface SubmissionResult {
    success: boolean;
    submissionId?: string;
    errorMessage?: string;
}
