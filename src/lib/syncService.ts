/**
 * syncService - 同步服务
 *
 * 职责：
 * - 封装同步服务相关的接口调用。
 * - 处理参数整理、错误兜底与结果转换。
 * - 向上层提供稳定的服务 API。
 */

import { supabase, shareSupabase } from '../supabaseClient';
import { TABLE } from '../services/tables';

export type SyncScope = 'agent' | 'map' | 'all';

export interface SyncOptions {
    userId: string; // 说明：个人库用户 ID。
    scope: SyncScope; // 说明：同步范围。
    mapName?: string; // 说明：地图名称（scope 为 map 时必填）。
    agentName?: string; // 说明：英雄名称（scope 为 agent 时必填）。
    adminEmail: string; // 说明：管理员邮箱（作为 user_id 写入共享库）。
}

export interface SyncResult {
    success: boolean;
    syncedCount: number;
    skippedCount: number;
    errorMessage?: string;
}

const checkIfSynced = async (sourceId: string): Promise<boolean> => {
    const { data } = await shareSupabase
        .from(TABLE.shared)
        .select('id')
        .eq('source_id', sourceId)
        .limit(1);

    return !!(data && data.length > 0);
};

export const syncLineupsToShared = async (
    options: SyncOptions,
    onProgress?: (current: number, total: number) => void,
): Promise<SyncResult> => {
    try {
        const { userId, scope, mapName, agentName, adminEmail } = options;

        let query = supabase
            .from(TABLE.lineups)
            .select('*')
            .eq('user_id', userId);

        if (scope === 'agent' && agentName) {
            query = query.eq('agent_name', agentName);
            if (mapName) {
                query = query.eq('map_name', mapName);
            }
        } else if (scope === 'map' && mapName) {
            query = query.eq('map_name', mapName);
        }

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

        let userDisplayId = userId.substring(0, 8).toUpperCase(); // 说明：默认使用 UUID 前 8 位。
        try {
            const { data: userData } = await supabase
                .from('user_profiles')
                .select('custom_id, nickname')
                .eq('id', userId)
                .single();

            if (userData?.custom_id) {
                userDisplayId = userData.custom_id;
            } else if (userData?.nickname) {
                userDisplayId = userData.nickname;
            }
        } catch {
        }

        let syncedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < lineups.length; i++) {
            const lineup = lineups[i];
            onProgress?.(i + 1, lineups.length);

            const alreadySynced = await checkIfSynced(lineup.id);
            if (alreadySynced) {
                skippedCount++;
                continue;
            }

            const sharedLineup = {
                id: lineup.id, // 说明：使用 id 作为主键（原 share_id）。
                source_id: lineup.id, // 说明：使用 id 作为主键（原 share_id）。
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
                author_name: lineup.author_name,
                author_avatar: lineup.author_avatar,
                author_uid: lineup.author_uid,
                creator_id: userDisplayId, // 说明：同步者 custom_id（短 ID）。
            };

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

export const getSyncableCount = async (
    userId: string,
    scope: SyncScope,
    mapName?: string,
    agentName?: string,
): Promise<{ total: number; synced: number }> => {
    let query = supabase
        .from(TABLE.lineups)
        .select('id')
        .eq('user_id', userId);

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
