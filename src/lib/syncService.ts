/**
 * 同步服务
 * 将个人库点位同步到共享库（数据库层面复制）
 */

import { supabase, shareSupabase } from '../supabaseClient';
import { TABLE } from '../services/tables';

/** 同步范围 */
export type SyncScope = 'agent' | 'map' | 'all';

/** 同步参数 */
export interface SyncOptions {
    userId: string;           // 个人库用户 ID
    scope: SyncScope;         // 同步范围
    mapName?: string;         // 地图名称（scope='map' 时必填）
    agentName?: string;       // 英雄名称（scope='agent' 时必填）
    adminEmail: string;       // 管理员邮箱（作为 user_id 写入共享库）
}

/** 同步结果 */
export interface SyncResult {
    success: boolean;
    syncedCount: number;
    skippedCount: number;
    errorMessage?: string;
}

/**
 * 生成 12 位 share_id
 */
const generateShareId = (): string => {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 12);
};

/**
 * 检查点位是否已同步到共享库
 * 通过 source_id 字段判断
 */
const checkIfSynced = async (sourceId: string): Promise<boolean> => {
    const { data } = await shareSupabase
        .from(TABLE.shared)
        .select('share_id')
        .eq('source_id', sourceId)
        .limit(1);

    return !!(data && data.length > 0);
};

/**
 * 同步个人库点位到共享库
 */
export const syncLineupsToShared = async (
    options: SyncOptions,
    onProgress?: (current: number, total: number) => void,
): Promise<SyncResult> => {
    try {
        const { userId, scope, mapName, agentName, adminEmail } = options;

        // 1. 构建查询条件
        let query = supabase
            .from(TABLE.lineups)
            .select('*')
            .eq('user_id', userId);

        // agent scope: 同时筛选英雄和当前地图
        if (scope === 'agent' && agentName) {
            query = query.eq('agent_name', agentName);
            if (mapName) {
                query = query.eq('map_name', mapName);
            }
        } else if (scope === 'map' && mapName) {
            query = query.eq('map_name', mapName);
        }

        // 2. 获取个人库点位
        const { data: lineups, error: fetchError } = await query;

        if (fetchError) {
            return {
                success: false,
                syncedCount: 0,
                skippedCount: 0,
                errorMessage: `获取点位失败: ${fetchError.message}`,
            };
        }

        if (!lineups || lineups.length === 0) {
            return {
                success: true,
                syncedCount: 0,
                skippedCount: 0,
                errorMessage: '没有要同步的点位',
            };
        }

        // 2.5 获取用户的 custom_id（短 ID）
        let userDisplayId = userId.substring(0, 8).toUpperCase(); // 默认使用 UUID 前 8 位
        try {
            const { data: userData } = await supabase
                .from(TABLE.users)
                .select('custom_id, nickname')
                .eq('id', userId)
                .single();

            if (userData?.custom_id) {
                userDisplayId = userData.custom_id;
            } else if (userData?.nickname) {
                userDisplayId = userData.nickname;
            }
        } catch {
            // 查询失败，使用默认值
        }

        // 3. 逐个同步
        let syncedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < lineups.length; i++) {
            const lineup = lineups[i];
            onProgress?.(i + 1, lineups.length);

            // 检查是否已同步
            const alreadySynced = await checkIfSynced(lineup.id);
            if (alreadySynced) {
                skippedCount++;
                continue;
            }

            // 构建共享库记录
            const sharedLineup = {
                share_id: generateShareId(),
                source_id: lineup.id,  // 记录来源，用于去重
                title: lineup.title,
                map_name: lineup.map_name,
                agent_name: lineup.agent_name,
                agent_icon: lineup.agent_icon,
                skill_icon: lineup.skill_icon,
                side: lineup.side,
                ability_index: lineup.ability_index,
                agent_pos: lineup.agent_pos,
                skill_pos: lineup.skill_pos,
                stand_img: lineup.stand_img,
                stand_desc: lineup.stand_desc,
                stand2_img: lineup.stand2_img,
                stand2_desc: lineup.stand2_desc,
                aim_img: lineup.aim_img,
                aim_desc: lineup.aim_desc,
                aim2_img: lineup.aim2_img,
                aim2_desc: lineup.aim2_desc,
                land_img: lineup.land_img,
                land_desc: lineup.land_desc,
                source_link: lineup.source_link,
                user_id: userDisplayId,  // 使用用户的 custom_id（短 ID）
            };

            // 插入共享库
            const { error: insertError } = await shareSupabase
                .from(TABLE.shared)
                .insert(sharedLineup);

            if (insertError) {
                console.error(`同步点位失败 (${lineup.id}):`, insertError);
                continue;
            }

            syncedCount++;
        }

        return {
            success: true,
            syncedCount,
            skippedCount,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : '同步失败';
        return {
            success: false,
            syncedCount: 0,
            skippedCount: 0,
            errorMessage: message,
        };
    }
};

/**
 * 获取待同步点位数量（用于预览）
 */
export const getSyncableCount = async (
    userId: string,
    scope: SyncScope,
    mapName?: string,
    agentName?: string,
): Promise<{ total: number; synced: number }> => {
    // 构建查询
    let query = supabase
        .from(TABLE.lineups)
        .select('id')
        .eq('user_id', userId);

    // agent scope: 同时筛选英雄和地图
    if (scope === 'agent' && agentName) {
        query = query.eq('agent_name', agentName);
        if (mapName) {
            query = query.eq('map_name', mapName);
        }
    } else if (scope === 'map' && mapName) {
        query = query.eq('map_name', mapName);
    }

    const { data: lineups } = await query;
    const total = lineups?.length || 0;

    // 检查已同步数量
    if (!lineups || lineups.length === 0) {
        return { total: 0, synced: 0 };
    }

    const ids = lineups.map(l => l.id);
    const { data: syncedData } = await shareSupabase
        .from(TABLE.shared)
        .select('source_id')
        .in('source_id', ids);

    const synced = syncedData?.length || 0;

    return { total, synced };
};
