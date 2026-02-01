/**
 * lineupImport - 点位导入逻辑 (本地化版本)
 * 职责：调用后端接口解析 ZIP 文件，并构建点位数据入库。
 */

import { uploadZipApi } from '../services/lineups';
import { LineupDbPayload, LineupSide } from '../types/lineup';
import { LOCAL_AGENTS } from '../data/localAgents';

export type ZipMetadata = {
    title: string;
    mapName: string;
    agentName: string;
    side: string;
    slot: string;
    agent_pos?: { lat: number; lng: number };
    skill_pos?: { lat: number; lng: number };
    ability_index?: number;
    // 描述相关
    stand_desc?: string;
    stand2_desc?: string;
    aim_desc?: string;
    aim2_desc?: string;
    land_desc?: string;
    // 链接与作者
    source_link?: string;
    author_name?: string | null;
    author_avatar?: string | null;
    author_uid?: string | null;
};

export type ImportResult = {
    success: boolean;
    payload?: LineupDbPayload;
    errorMessage?: string;
};

/**
 * 将槽位字符串 (如 "技能Q") 映射为前端索引
 */
function mapSlotToIndex(slot: string): number | null {
    if (!slot) return null;
    if (slot.includes('Q')) return 0;
    if (slot.includes('E')) return 1;
    if (slot.includes('C')) return 2;
    if (slot.includes('X')) return 3;
    return null;
}

/**
 * 尝试从文件名解析基本元数据 (用于预览)
 */
export const parseZipMetadata = async (zipFile: File): Promise<ZipMetadata> => {
    const zipName = zipFile.name.replace(/\.zip$/i, '');
    const parts = zipName.split('_');

    if (parts.length < 4) {
        throw new Error('文件名格式不规范 (需为: 地图_英雄_技能_标题.zip)');
    }

    const title = parts.slice(3).join('_');
    return {
        title,
        mapName: parts[0],
        agentName: parts[1],
        side: title.startsWith('防守') ? 'defense' : 'attack',
        slot: parts[2] || 'Ability'
    };
};

/**
 * 从 ZIP 文件执行导入
 */
export const importLineupFromZip = async (
    zipFile: File,
    userId: string
): Promise<ImportResult> => {
    try {
        const result = await uploadZipApi(zipFile);

        if (!result.success) {
            return { success: false, errorMessage: '服务器处理失败' };
        }

        const { metadata, paths } = result;

        // 英雄名称映射 (处理中英文兼容)
        const agentNameMap: Record<string, string> = {
            'Phoenix': '不死鸟',
            'Jett': '捷风',
            'Sova': '猎枭',
            'Sage': '贤者',
            'Cypher': '零',
            'Killjoy': '奇乐',
            'Raze': '雷兹',
            'Viper': '蝰蛇',
            'Brimstone': '炼狱',
            'Omen': '幽影',
            'Breach': '铁臂',
            'Reyna': '芮娜',
            'Skye': '斯凯',
            'Yoru': '夜露',
            'Astra': '星礈',
            'KAY/O': 'K/O',
            'Chamber': '尚勃勒',
            'Neon': '霓虹',
            'Fade': '黑梦',
            'Harbor': '海神',
            'Gekko': '盖可',
            'Deadlock': '钢锁',
            'Iso': '壹决',
            'Clove': '暮蝶',
            'Vyse': '维斯',
            'Teafox': '钛狐'
        };

        const finalAgentName = agentNameMap[metadata.agentName] || metadata.agentName;
        const agent = LOCAL_AGENTS.find(a => a.displayName === finalAgentName);
        const agentIcon = agent?.displayIcon || null;

        // 优先使用后端解析的 ability_index，否则使用槽位映射
        const abilityIndex = metadata.ability_index !== undefined
            ? metadata.ability_index
            : mapSlotToIndex(metadata.slot);

        // 构建数据库负载
        const payload: LineupDbPayload = {
            title: metadata.title,
            map_name: metadata.mapName,
            agent_name: metadata.agent_name || metadata.agentName,
            agent_icon: agentIcon,
            skill_icon: null, // 将在保存时或后续解析
            side: metadata.side as LineupSide,
            ability_index: abilityIndex,
            agent_pos: metadata.agent_pos || { lat: 0, lng: 0 },
            skill_pos: metadata.skill_pos || { lat: 0, lng: 0 },
            // 图片路径使用后端返回的规范化路径
            stand_img: paths.stand_img || null,
            stand2_img: paths.stand2_img || null,
            aim_img: paths.aim_img || null,
            aim2_img: paths.aim2_img || null,
            land_img: paths.land_img || null,
            // 描述信息
            stand_desc: metadata.stand_desc || null,
            stand2_desc: metadata.stand2_desc || null,
            aim_desc: metadata.aim_desc || null,
            aim2_desc: metadata.aim2_desc || null,
            land_desc: metadata.land_desc || null,
            // 作者与来源
            source_link: metadata.source_link || null,
            author_name: metadata.author_name || null,
            author_avatar: metadata.author_avatar || null,
            author_uid: metadata.author_uid || null,
            user_id: userId,
            created_at: new Date().toISOString(),
        };

        return { success: true, payload };
    } catch (error) {
        return {
            success: false,
            errorMessage: error instanceof Error ? error.message : '未知错误'
        };
    }
};
