/**
 * systemSettings - 系统全局配置服务
 * 
 * 职责：
 * - 管理应用级的全局开关（投稿功能开关、每日限额、官方图床配置等）
 * - 为频繁读取的配置提供带 TTL 的内存缓存，降低数据库负载
 */
import { supabase } from '../supabaseClient';
import { ImageBedConfig } from '../types/imageBed';
import { AuthorLinks } from '../types/authorLinks';

/** 系统设置类型 */
export interface SystemSettings {
    id: string;
    personal_library_url: string;
    shared_library_url: string;
    // 投稿相关
    official_oss_config: ImageBedConfig | null;
    submission_enabled: boolean;
    daily_submission_limit: number;
    // 下载限制
    daily_download_limit: number;
    // 作者信息链接
    author_links: AuthorLinks | null;
    // 时间戳
    created_at: string;
    updated_at: string;
}

/** 固定的配置行 ID */
const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

/** 内存缓存 */
let cachedSettings: SystemSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 1000; // 5 秒缓存，确保配置更新后能较快生效

/**
 * 获取系统设置
 * 带有 1 分钟内存缓存，减少数据库请求
 */
export async function getSystemSettings(): Promise<SystemSettings | null> {
    const now = Date.now();

    // 检查缓存是否有效
    if (cachedSettings && now - cacheTimestamp < CACHE_TTL) {
        return cachedSettings;
    }

    const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single();

    if (error) {
        console.error('Failed to fetch system settings:', error);
        console.error('SETTINGS_ID used:', SETTINGS_ID);
        return cachedSettings; // 返回旧缓存
    }

    console.log('[SystemSettings] Loaded:', data?.author_links ? 'has author_links' : 'NO author_links');

    cachedSettings = data;
    cacheTimestamp = now;
    return data;
}

/**
 * 更新系统设置
 */
export async function updateSystemSettings(
    updates: Partial<Pick<SystemSettings,
        | 'personal_library_url'
        | 'shared_library_url'
        | 'official_oss_config'
        | 'submission_enabled'
        | 'daily_submission_limit'
        | 'daily_download_limit'
        | 'author_links'
    >>
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('system_settings')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', SETTINGS_ID);

    if (error) {
        console.error('Failed to update system settings:', error);
        return { success: false, error: error.message };
    }

    // 清除缓存，下次读取时会重新获取
    cachedSettings = null;
    cacheTimestamp = 0;

    return { success: true };
}

/**
 * 强制刷新缓存
 */
export function invalidateSettingsCache(): void {
    cachedSettings = null;
    cacheTimestamp = 0;
}
