/**
 * downloadLimit - 基础库
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
 * - `DownloadLogParams`
 *
 * 依赖关系：
 * - 上游依赖：`../supabaseClient`、`./systemSettings`
 * - 下游影响：供 hooks/features/services 复用
 */

import { supabase } from '../supabaseClient';
import { getSystemSettings } from './systemSettings';

export async function checkDailyDownloadLimit(userId: string, count: number = 1): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const settings = await getSystemSettings();
    const limit = settings?.daily_download_limit || 50; // 说明：默认限制为 50。

    const today = new Date().toISOString().split('T')[0]; // 说明：格式为 YYYY-MM-DD。

    const { data, error } = await supabase
        .from('user_daily_downloads')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    if (error && error.code !== 'PGRST116') { // 说明：PGRST116 表示未找到。
        console.error('Failed to check download limit:', error);
        return { allowed: true, remaining: limit, limit };
    }

    const currentCount = data?.count || 0;
    const remaining = Math.max(0, limit - currentCount);

    return {
        allowed: currentCount + count <= limit,
        remaining,
        limit
    };
}

export async function incrementDownloadCount(userId: string, count: number = 1): Promise<void> {
    const today = new Date().toISOString().split('T')[0];





    const { data } = await supabase
        .from('user_daily_downloads')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    const newCount = (data?.count || 0) + count;

    const { error } = await supabase
        .from('user_daily_downloads')
        .upsert({
            user_id: userId,
            date: today,
            count: newCount,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,date' });

    if (error) {
        console.error('Failed to increment download count:', error);
    }
}

export interface DownloadLogParams {
    userId: string;
    userEmail: string;
    lineupId: string;
    lineupTitle: string;
    mapName: string;
    agentName: string;
    downloadCount?: number;
}

export async function logDownload(params: DownloadLogParams): Promise<void> {
    const { userId, userEmail, lineupId, lineupTitle, mapName, agentName, downloadCount = 1 } = params;

    const { error } = await supabase
        .from('download_logs')
        .insert({
            user_id: userId,
            user_email: userEmail,
            lineup_id: lineupId,
            lineup_title: lineupTitle,
            map_name: mapName,
            agent_name: agentName,
            download_count: downloadCount,
        });

    if (error) {
        console.error('Failed to log download:', error);
    }
}
