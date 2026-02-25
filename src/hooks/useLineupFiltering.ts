/**
 * useLineupFiltering - Hook 层
 *
 * 模块定位：
 * - 所在层级：Hook 层
 * - 主要目标：封装状态、副作用与交互流程
 *
 * 关键职责：
 * - 封装状态管理与副作用控制
 * - 对外暴露清晰的交互动作与派生状态
 * - 隔离组件层与数据层耦合
 *
 * 主要导出：
 * - `useLineupFiltering`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../constants/maps`、`../types/lineup`
 * - 下游影响：供组件与控制器复用
 */

import { useMemo } from 'react';
import { MAP_TRANSLATIONS } from '../constants/maps';
import { BaseLineup, SharedLineup, LineupSide } from '../types/lineup';

type UseLineupFilteringParams = {
  lineups: BaseLineup[];
  selectedMap: { displayName: string } | null;
  selectedAgent: { displayName: string } | null;
  selectedSide: 'all' | LineupSide;
  selectedAbilityIndex: number | null;
  searchQuery: string;
};

export function useLineupFiltering({
  lineups,
  selectedMap,
  selectedAgent,
  selectedSide,
  selectedAbilityIndex,
  searchQuery,
}: UseLineupFilteringParams) {
  const mapZhToEn = useMemo<Record<string, string>>(() => {
    const reverse: Record<string, string> = {};
    Object.entries(MAP_TRANSLATIONS).forEach(([en, zh]) => {
      reverse[zh] = en;
    });
    return reverse;
  }, []);

  const agentCounts = useMemo<Record<string, number>>(() => {
    if (!selectedMap) return {};
    const mapKey = selectedMap.displayName;
    const mapKeyEn = mapZhToEn[mapKey] || mapKey;
    const counts: Record<string, number> = {};
    lineups.forEach((l) => {
      if (l.mapName !== mapKey && l.mapName !== mapKeyEn) return;
      counts[l.agentName] = (counts[l.agentName] || 0) + 1;
    });
    return counts;
  }, [lineups, selectedMap, selectedSide, mapZhToEn]);

  const filteredLineups = useMemo(() => {
    if (!selectedMap) return [];
    const mapKey = selectedMap.displayName;
    const mapKeyEn = mapZhToEn[mapKey] || mapKey;
    return lineups.filter((l) => {
      const mapMatch = l.mapName === mapKey || l.mapName === mapKeyEn;
      const agentMatch = !selectedAgent || l.agentName === selectedAgent.displayName;
      const sideMatch = selectedSide === 'all' || l.side === selectedSide;
      const abilityMatch = selectedAbilityIndex === null || l.abilityIndex === selectedAbilityIndex;
      const searchMatch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase());
      return mapMatch && agentMatch && sideMatch && abilityMatch && searchMatch;
    });
  }, [lineups, selectedMap, selectedAgent, selectedSide, selectedAbilityIndex, searchQuery, mapZhToEn]);

  const isFlipped = selectedSide === 'defense';

  const mapLineups = useMemo(() => {
    return filteredLineups;
  }, [filteredLineups]);

  const allMapLineups = useMemo(() => {
    if (!selectedMap) return [];
    const mapKey = selectedMap.displayName;
    const mapKeyEn = mapZhToEn[mapKey] || mapKey;
    return lineups.filter(l => l.mapName === mapKey || l.mapName === mapKeyEn);
  }, [lineups, selectedMap, mapZhToEn]);

  return { agentCounts, filteredLineups, isFlipped, mapLineups, allMapLineups };
}
