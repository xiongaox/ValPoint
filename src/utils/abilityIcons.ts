/**
 * abilityIcons - 工具层
 *
 * 模块定位：
 * - 所在层级：工具层
 * - 主要目标：提供无状态工具函数
 *
 * 关键职责：
 * - 提供轻量且可复用的纯工具方法
 * - 避免重复实现常见转换/解析逻辑
 * - 维持调用方代码简洁
 *
 * 主要导出：
 * - `getAbilityList`、`getAbilityIcon`、`getAbilityTitle`
 *
 * 依赖关系：
 * - 上游依赖：`../data/localAgents`、`../data/ability_overrides.json`
 * - 下游影响：供 hooks/components/services 复用
 */

// @ts-nocheck

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
  return agent.abilities.filter((a: Ability) => (a.slot || '').toLowerCase() !== 'passive');
};

const resolveSlotKey = (ability: Ability, idx: number) => {
  const key = ability?.keypad || BUTTON_KEYS[idx] || null;
  return key;
};

const pickOverrideIcon = (key: string, override: any) => {
  if (!override) return null;
  if (override.iconUrl?.[key]) return override.iconUrl[key];
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

  const icon = pickOverrideIcon(slotKey, override);
  if (icon) return icon;

  return ability.displayIcon || null;
};

export const getAbilityTitle = (agent: Agent, slotKey: string, fallback?: string) => {
  const key = normalizeAgentKey(agent);
  const override = abilityOverrides?.[key];
  return pickOverrideTitle(slotKey, override) || fallback || slotKey;
};
