/**
 * normalize - 服务层
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
 * - `normalizeLineup`
 *
 * 依赖关系：
 * - 上游依赖：`../constants/maps`、`../types/lineup`
 * - 下游影响：供 hooks/controllers 复用
 */

import { MAP_TRANSLATIONS } from '../constants/maps';
import { BaseLineup } from '../types/lineup';

export const normalizeLineup = (raw: any, mapNameZhToEn: Record<string, string>): BaseLineup => {
  const pick = (a: any, b: any) => (a !== undefined ? a : b);
  const mapNameRaw = pick(raw.map_name, raw.mapName);
  return {
    id: raw.id,
    title: pick(raw.title, ''),
    mapName: mapNameZhToEn[mapNameRaw] || mapNameRaw,
    agentName: pick(raw.agent_name, raw.agentName),
    agentIcon: pick(raw.agent_icon, raw.agentIcon),
    skillIcon: pick(raw.skill_icon, raw.skillIcon),
    side: pick(raw.side, 'attack'),
    abilityIndex: pick(raw.ability_index, raw.abilityIndex),
    agentPos: pick(raw.agent_pos, raw.agentPos),
    skillPos: pick(raw.skill_pos, raw.skillPos),
    standImg: pick(raw.stand_img, raw.standImg),
    standDesc: pick(raw.stand_desc, raw.standDesc),
    stand2Img: pick(raw.stand2_img, raw.stand2Img),
    stand2Desc: pick(raw.stand2_desc, raw.stand2Desc),
    aimImg: pick(raw.aim_img, raw.aimImg),
    aimDesc: pick(raw.aim_desc, raw.aimDesc),
    aim2Img: pick(raw.aim2_img, raw.aim2Img),
    aim2Desc: pick(raw.aim2_desc, raw.aim2Desc),
    landImg: pick(raw.land_img, raw.landImg),
    landDesc: pick(raw.land_desc, raw.landDesc),
    sourceLink: pick(raw.source_link, raw.sourceLink),
    authorName: pick(raw.author_name, raw.authorName),
    authorAvatar: pick(raw.author_avatar, raw.authorAvatar),
    authorUid: pick(raw.author_uid, raw.authorUid),
    createdAt: pick(raw.created_at, raw.createdAt),
    updatedAt: pick(raw.updated_at, raw.updatedAt),
    clonedFrom: pick(raw.cloned_from, raw.clonedFrom),
    userId: pick(raw.user_id, raw.userId),
    creatorId: pick(raw.creator_id, raw.creatorId),
  };
};
