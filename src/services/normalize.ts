/**
 * normalize - normalize
 *
 * 职责：
 * - 封装normalize相关的接口调用。
 * - 处理参数整理、错误兜底与结果转换。
 * - 向上层提供稳定的服务 API。
 */

import { MAP_TRANSLATIONS } from '../constants/maps';
import { BaseLineup } from '../types/lineup';
import { LOCAL_AGENTS } from '../data/localAgents';
import { getAbilityIcon } from '../utils/abilityIcons';

export const normalizeLineup = (raw: any, mapNameZhToEn: Record<string, string>): BaseLineup => {
  const pick = (a: any, b: any) => (a !== undefined ? a : b);
  const mapNameRaw = pick(raw.map_name, raw.mapName);

  // 查找对应英雄数据以补充图标
  const agentName = pick(raw.agent_name, raw.agentName);
  const agent = LOCAL_AGENTS.find(
    (a) => a.displayName === agentName || a.uuid === pick(raw.agent_id, raw.agentId)
  );

  // 获取技能图标
  let skillIcon = pick(raw.skill_icon, raw.skillIcon);
  const abilityIndex = pick(raw.ability_index, raw.abilityIndex);

  if (!skillIcon && agent && typeof abilityIndex === 'number') {
    skillIcon = getAbilityIcon(agent, abilityIndex);
  }

  return {
    id: raw.id,
    title: pick(raw.title, ''),
    mapName: mapNameZhToEn[mapNameRaw] || mapNameRaw, // 英文名（用于ID/路径）
    // 如果需要保留中文名展示，可能需要额外字段，或者 mapNameZhToEn 应该是 En->Zh? 
    // 假设 mapNameZhToEn 是把中文转英文ID，这里 logic 似乎是：如果有映射用映射，否则用原值。

    agentName: agentName,
    agentIcon: pick(raw.agent_icon, raw.agentIcon) || agent?.displayIcon || null,
    skillIcon: skillIcon,
    side: pick(raw.side, 'attack'),
    abilityIndex: abilityIndex,
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
