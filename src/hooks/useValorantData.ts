import { useEffect, useState } from 'react';
import { AgentData, MapOption } from '../types/lineup';
import { localAgents } from '../data/localAgents';
import { localMaps } from '../data/localMaps';

export function useValorantData() {
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedMap, setSelectedMap] = useState<MapOption | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    const sortedAgents = [...localAgents].sort((a, b) => a.displayName.localeCompare(b.displayName));
    setAgents(sortedAgents);
    if (sortedAgents.length > 0) setSelectedAgent(sortedAgents[0]);

    // 地图保持 localMaps 定义的顺序，不排序
    setMaps(localMaps);
    if (localMaps.length > 0) {
      // 默认选择第一个地图（Abyss）
      setSelectedMap(localMaps[0]);
    }
  }, []);

  return {
    maps,
    setMaps,
    agents,
    setAgents,
    selectedMap,
    setSelectedMap,
    selectedAgent,
    setSelectedAgent,
  };
}
