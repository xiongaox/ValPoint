/**
 * systemSettings - 基础库
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
 * - `SystemSettings`、`invalidateSettingsCache`
 *
 * 依赖关系：
 * - 上游依赖：`../supabaseClient`、`../types/imageBed`、`../types/authorLinks`
 * - 下游影响：供 hooks/features/services 复用
 */

import { adminSupabase } from '../supabaseClient';
import { ImageBedConfig } from '../types/imageBed';
import { AuthorLinks } from '../types/authorLinks';

export interface SystemSettings {
    id: string;
    official_oss_config: ImageBedConfig | null;
    submission_enabled: boolean;
    daily_submission_limit: number;
    daily_download_limit: number;
    author_links: AuthorLinks | null;
    created_at: string;
    updated_at: string;
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

let cachedSettings: SystemSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 1000; // 说明：5 秒缓存，便于更快刷新配置。

export async function getSystemSettings(): Promise<SystemSettings | null> {
    const now = Date.now();

    if (cachedSettings && now - cacheTimestamp < CACHE_TTL) {
        return cachedSettings;
    }

    const { data, error } = await adminSupabase
        .from('system_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single();

    if (error) {
        console.error('Failed to fetch system settings:', error);
        console.error('SETTINGS_ID used:', SETTINGS_ID);
        return cachedSettings; // 说明：返回缓存配置。
    }



    cachedSettings = data;
    cacheTimestamp = now;
    return data;
}

export async function updateSystemSettings(
    updates: Partial<Pick<SystemSettings,
        | 'official_oss_config'
        | 'submission_enabled'
        | 'daily_submission_limit'
        | 'daily_download_limit'
        | 'author_links'
    >>
): Promise<{ success: boolean; error?: string }> {
    const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
    };


    const { data, error } = await adminSupabase
        .from('system_settings')
        .update(payload)
        .eq('id', SETTINGS_ID)
        .select();



    if (error) {
        console.error('Failed to update system settings:', error);
        return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
        console.error('RLS policy blocked the update - no rows affected');
        return {
            success: false,
            error: '权限不足：您没有修改系统设置的权限。请确认您是管理员角色。'
        };
    }

    cachedSettings = null;
    cacheTimestamp = 0;

    return { success: true };
}

export function invalidateSettingsCache(): void {
    cachedSettings = null;
    cacheTimestamp = 0;
}
