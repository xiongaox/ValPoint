/**
 * submissionUpload - 占位模块（本地版本）
 * 本地化版本不支持投稿功能
 */

import { BaseLineup } from '../types/lineup';

export interface SubmissionProgress {
    status: 'uploading' | 'saving' | 'done';
    uploadedCount: number;
    totalImages: number;
}

export async function submitLineupDirectly(
    lineup: BaseLineup,
    userId: string,
    customId?: string,
    onProgress?: (progress: SubmissionProgress) => void
): Promise<{ success: boolean; message?: string; errorMessage?: string }> {
    return {
        success: false,
        errorMessage: '本地版本不支持投稿功能',
    };
}

export async function checkDailySubmissionLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number;
}> {
    return {
        allowed: true,
        remaining: 999,
    };
}
