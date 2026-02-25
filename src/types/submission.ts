/**
 * submission - 类型层
 *
 * 模块定位：
 * - 所在层级：类型层
 * - 主要目标：集中定义跨模块共享类型
 *
 * 关键职责：
 * - 定义稳定的类型契约与字段语义
 * - 减少跨模块调用歧义
 * - 提升重构与联调时的可预期性
 *
 * 主要导出：
 * - `SubmissionStatus`、`LineupPosition`、`LineupSubmission`、`SubmissionFormData`、`SubmissionProgress`、`SubmissionResult`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供全局编译期约束
 */

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface LineupPosition {
    lat: number;
    lng: number;
}

export interface LineupSubmission {
    id: string;
    submitter_id: string;
    submitter_email?: string;
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
    source_link?: string;
    author_name?: string;
    author_avatar?: string;
    author_uid?: string;
    status: SubmissionStatus;
    reject_reason?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    created_at: string;
    updated_at: string;
}

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
    stand_img?: string;
    stand_desc?: string;
    aim_img?: string;
    aim_desc?: string;
    aim2_img?: string;
    aim2_desc?: string;
    land_img?: string;
    land_desc?: string;
    source_link?: string;
    author_name?: string;
    author_avatar?: string;
    author_uid?: string;
}

export interface SubmissionProgress {
    status: 'uploading' | 'saving' | 'done' | 'error';
    uploadedCount: number;
    totalImages: number;
    errorMessage?: string;
}

export interface SubmissionResult {
    success: boolean;
    submissionId?: string;
    errorMessage?: string;
}
