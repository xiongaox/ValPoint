// @ts-nocheck
import { useMemo } from 'react';
import { MAP_TRANSLATIONS } from '../constants/maps';

export function useLineupFiltering({
  lineups,
  sharedLineups,
  libraryMode,
  selectedMap,
  selectedAgent,
  selectedSide,
  selectedAbilityIndex,
  searchQuery,
  activeTab,
  sharedLineup,
}) {
  const mapZhToEn = useMemo(() => {
    const reverse = {};
    Object.entries(MAP_TRANSLATIONS).forEach(([en, zh]) => {
      reverse[zh] = en;
    });
    return reverse;
  }, []);

  const agentCounts = useMemo(() => {
    if (!selectedMap) return {};
    const mapKey = selectedMap.displayName;
    const mapKeyEn = mapZhToEn[mapKey] || mapKey;
    const counts = {};
    const source = libraryMode === 'shared' ? sharedLineups : lineups;
    source.forEach((l) => {
      if (l.mapName !== mapKey && l.mapName !== mapKeyEn) return;
      // 角标展示该地图下该特工的总数，不受攻/防筛选影响
      counts[l.agentName] = (counts[l.agentName] || 0) + 1;
    });
    return counts;
  }, [lineups, sharedLineups, selectedMap, selectedSide, libraryMode, mapZhToEn]);

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

  const sharedFilteredLineups = useMemo(() => {
    if (!selectedMap) return [];
    const mapKey = selectedMap.displayName;
    const mapKeyEn = mapZhToEn[mapKey] || mapKey;
    return sharedLineups.filter((l) => {
      const mapMatch = l.mapName === mapKey || l.mapName === mapKeyEn;
      const agentMatch = !selectedAgent || l.agentName === selectedAgent.displayName;
      const sideMatch = selectedSide === 'all' || l.side === selectedSide;
      const abilityMatch = selectedAbilityIndex === null || l.abilityIndex === selectedAbilityIndex;
      const searchMatch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase());
      return mapMatch && agentMatch && sideMatch && abilityMatch && searchMatch;
    });
  }, [sharedLineups, selectedMap, selectedAgent, selectedSide, selectedAbilityIndex, searchQuery, mapZhToEn]);

  const isFlipped = activeTab === 'shared' ? sharedLineup?.side === 'defense' : selectedSide === 'defense';

  const mapLineups = useMemo(() => {
    if (activeTab === 'shared' && sharedLineup) return [sharedLineup];
    if (activeTab === 'view' || activeTab === 'create') return libraryMode === 'shared' ? sharedFilteredLineups : filteredLineups;
    return libraryMode === 'shared' ? sharedLineups : lineups;
  }, [activeTab, sharedLineup, filteredLineups, sharedFilteredLineups, lineups, sharedLineups, libraryMode]);

  return { agentCounts, filteredLineups, sharedFilteredLineups, isFlipped, mapLineups };
}
