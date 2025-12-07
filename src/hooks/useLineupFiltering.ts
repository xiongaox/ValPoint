// @ts-nocheck
import { useMemo } from 'react';

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
  const agentCounts = useMemo(() => {
    if (!selectedMap) return {};
    const mapKey = selectedMap.displayName;
    const counts = {};
    const source = libraryMode === 'shared' ? sharedLineups : lineups;
    source.forEach((l) => {
      if (l.mapName !== mapKey) return;
      if (selectedSide !== 'all' && l.side !== selectedSide) return;
      counts[l.agentName] = (counts[l.agentName] || 0) + 1;
    });
    return counts;
  }, [lineups, sharedLineups, selectedMap, selectedSide, libraryMode]);

  const filteredLineups = useMemo(() => {
    if (!selectedMap) return [];
    const mapKey = selectedMap.displayName;
    return lineups.filter((l) => {
      const mapMatch = l.mapName === mapKey;
      const agentMatch = !selectedAgent || l.agentName === selectedAgent.displayName;
      const sideMatch = selectedSide === 'all' || l.side === selectedSide;
      const abilityMatch = selectedAbilityIndex === null || l.abilityIndex === selectedAbilityIndex;
      const searchMatch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase());
      return mapMatch && agentMatch && sideMatch && abilityMatch && searchMatch;
    });
  }, [lineups, selectedMap, selectedAgent, selectedSide, selectedAbilityIndex, searchQuery]);

  const sharedFilteredLineups = useMemo(() => {
    if (!selectedMap) return [];
    const mapKey = selectedMap.displayName;
    return sharedLineups.filter((l) => {
      const mapMatch = l.mapName === mapKey;
      const agentMatch = !selectedAgent || l.agentName === selectedAgent.displayName;
      const sideMatch = selectedSide === 'all' || l.side === selectedSide;
      const abilityMatch = selectedAbilityIndex === null || l.abilityIndex === selectedAbilityIndex;
      const searchMatch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase());
      return mapMatch && agentMatch && sideMatch && abilityMatch && searchMatch;
    });
  }, [sharedLineups, selectedMap, selectedAgent, selectedSide, selectedAbilityIndex, searchQuery]);

  const isFlipped = activeTab === 'shared' ? sharedLineup?.side === 'defense' : selectedSide === 'defense';

  const mapLineups = useMemo(() => {
    if (activeTab === 'shared' && sharedLineup) return [sharedLineup];
    if (activeTab === 'view' || activeTab === 'create') return libraryMode === 'shared' ? sharedFilteredLineups : filteredLineups;
    return libraryMode === 'shared' ? sharedLineups : lineups;
  }, [activeTab, sharedLineup, filteredLineups, sharedFilteredLineups, lineups, sharedLineups, libraryMode]);

  return { agentCounts, filteredLineups, sharedFilteredLineups, isFlipped, mapLineups };
}
