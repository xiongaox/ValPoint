/**
 * mapPoolService - 服务层
 *
 * 模块定位：
 * - 所在层级：服务层
 * - 主要目标：面向数据访问与结果归一化
 *
 * 关键职责：
 * - 对外提供可复用的数据访问函数
 * - 统一处理查询参数、字段映射与错误抛出
 * - 保证上层拿到稳定的数据结构
 *
 * 主要导出：
 * - `clearMapPoolCache`
 *
 * 依赖关系：
 * - 上游依赖：`../types/lineup`
 * - 下游影响：供 hooks/controllers 复用
 */

import { MapPoolStatus } from '../types/lineup';

/** 远程 API 地址 */
const API_URL = 'https://xiongaox.github.io/valorant-rotation-api/maps.json';

/** API 返回的地图状态类型 */
type ApiMapStatus = 'in_pool' | 'returning' | 'rotated_out' | 'add';

/** API 响应结构 */
type ApiResponse = {
    maps: Array<{
        name_zh: string;
        name_en: string;
        status: ApiMapStatus;
    }>;
};

let cachedConfig: Record<string, MapPoolStatus> | null = null;

/**
 * 将 API 状态格式转换为内部格式
 * API 使用下划线格式（in_pool），内部使用短横线格式（in-pool）
 */
function convertStatus(apiStatus: ApiMapStatus): MapPoolStatus {
    const statusMap: Record<ApiMapStatus, MapPoolStatus> = {
        'in_pool': 'in-pool',
        'returning': 'returning',
        'rotated_out': 'rotated-out',
        'add': 'new',
    };
    return statusMap[apiStatus] || 'in-pool';
}

/**
 * 获取地图池配置
 * @returns 地图英文名称到状态的映射
 */
export async function fetchMapPoolConfig(): Promise<Record<string, MapPoolStatus>> {
    if (cachedConfig) {
        return cachedConfig;
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json: ApiResponse = await response.json();

        // 转换为 displayName -> poolStatus 的映射
        cachedConfig = json.maps.reduce((acc, item) => {
            acc[item.name_en] = convertStatus(item.status);
            return acc;
        }, {} as Record<string, MapPoolStatus>);

        return cachedConfig;
    } catch (error) {
        console.error('[mapPoolService] Failed to fetch config from API:', error);
        return {};
    }
}

/**
 * 清除缓存（用于手动刷新）
 */
export function clearMapPoolCache() {
    cachedConfig = null;
}
