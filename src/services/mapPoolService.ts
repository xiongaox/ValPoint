/**
 * mapPoolService - 地图池配置服务
 *
 * 职责：
 * - 从 Supabase 获取地图排位池状态配置
 * - 缓存配置数据，避免重复请求
 */

import { supabase } from '../supabaseClient';
import { MapPoolStatus } from '../types/lineup';

export type MapPoolConfig = {
    map_name: string;
    pool_status: MapPoolStatus;
    updated_at: string;
};

let cachedConfig: MapPoolConfig[] | null = null;

/**
 * 获取地图池配置
 * @returns 地图名称到状态的映射
 */
export async function fetchMapPoolConfig(): Promise<Record<string, MapPoolStatus>> {
    if (cachedConfig) {
        return configToMap(cachedConfig);
    }

    const { data, error } = await supabase
        .from('map_pool_config')
        .select('map_name, pool_status, updated_at');

    if (error) {
        console.error('[mapPoolService] Failed to fetch config:', error);
        return {};
    }

    cachedConfig = data as MapPoolConfig[];
    return configToMap(cachedConfig);
}

/**
 * 清除缓存（用于手动刷新）
 */
export function clearMapPoolCache() {
    cachedConfig = null;
}

function configToMap(config: MapPoolConfig[]): Record<string, MapPoolStatus> {
    return config.reduce((acc, item) => {
        acc[item.map_name] = item.pool_status;
        return acc;
    }, {} as Record<string, MapPoolStatus>);
}
