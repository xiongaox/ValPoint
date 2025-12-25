// @ts-nocheck
// 使用 ability_overrides.json 提供的技能图标和名称；槽位统一采用 C/Q/E/X（依次对应按钮1/2/3/4）。

/**
 * abilityIcons.ts - 特工技能图标工具
 * 
 * 职责：
 * - 映射特工技能与其对应的官方图标 URL
 * - 处理某些技能图标的特殊回退逻辑
 */
import { LOCAL_AGENTS } from '../data/localAgents';
import abilityOverrides from '../data/ability_overrides.json';

type Ability = { slot?: string; displayIcon?: string; name?: string; keypad?: string };
type Agent = { displayName?: string; abilities?: Ability[] };

const BUTTON_KEYS = ['C', 'Q', 'E', 'X'];
const MAP_OLD_TO_NEW = {
  Ability1: 'C',
  Ability2: 'Q',
  Grenade: 'E',
  Ultimate: 'X',
};

const normalizeAgentKey = (agent: Agent) => agent?.displayName || '';

export const getAbilityList = (agent: Agent) => {
  if (!agent?.abilities) return [];
  // 过滤被动，保持原始顺序（与按钮索引对应）
  return agent.abilities.filter((a: Ability) => (a.slot || '').toLowerCase() !== 'passive');
};

const resolveSlotKey = (ability: Ability, idx: number) => {
  // 优先用服务返回的 keypad，其次按按钮索引映射 C/Q/E/X
  const key = ability?.keypad || BUTTON_KEYS[idx] || null;
  return key;
};

const pickOverrideIcon = (key: string, override: any) => {
  if (!override) return null;
  // 先按新键（C/Q/E/X）
  if (override.iconUrl?.[key]) return override.iconUrl[key];
  // 再尝试旧键转换
  const oldKey = Object.keys(MAP_OLD_TO_NEW).find((k) => MAP_OLD_TO_NEW[k] === key);
  if (oldKey && override.iconUrl?.[oldKey]) return override.iconUrl[oldKey];
  return null;
};

const pickOverrideTitle = (key: string, override: any) => {
  if (!override) return null;
  if (override.titles?.[key]) return override.titles[key];
  const oldKey = Object.keys(MAP_OLD_TO_NEW).find((k) => MAP_OLD_TO_NEW[k] === key);
  if (oldKey && override.titles?.[oldKey]) return override.titles[oldKey];
  return null;
};

export const getAbilityIcon = (agent: Agent, abilityIndex: number | null) => {
  if (!agent || abilityIndex === null || abilityIndex === undefined) return null;
  const list = getAbilityList(agent);
  const ability = list[abilityIndex];
  if (!ability) return null;

  const key = normalizeAgentKey(agent);
  const override = abilityOverrides?.[key];
  const slotKey = resolveSlotKey(ability, abilityIndex);

  // JSON 覆盖优先（C/Q/E/X），其次旧键
  const icon = pickOverrideIcon(slotKey, override);
  if (icon) return icon;

  // 回退到原始 displayIcon
  return ability.displayIcon || null;
};

export const getAbilityTitle = (agent: Agent, slotKey: string, fallback?: string) => {
  const key = normalizeAgentKey(agent);
  const override = abilityOverrides?.[key];
  return pickOverrideTitle(slotKey, override) || fallback || slotKey;
};
