/**
 * useValorantData - Valorant 游戏数据 Hook
 * 
 * 管理地图和特工的基础数据：
 * - 从本地数据加载地图列表和特工列表
 * - 管理当前选中的地图和特工状态
 * - 特工按名称排序，地图保持预定义顺序
 */
/**
 * useValorantData.ts - 游戏元数据（特工、地图）加载 Hook
 * 
 * 职责：
 * - 统一管理应用启动时所需的游戏静态数据
 * - 优先从线上 API 加载，并在失败时自动回退到本地 LOCAL_AGENTS/LOCAL_MAPS
 */
import { useEffect, useState } from 'react';
import { AgentData, MapOption } from '../types/lineup';
import { LOCAL_AGENTS } from '../data/localAgents';
import { LOCAL_MAPS } from '../data/localMaps';

export function useValorantData() {
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedMap, setSelectedMap] = useState<MapOption | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    const sortedAgents = [...LOCAL_AGENTS].sort((a, b) => a.displayName.localeCompare(b.displayName));
    setAgents(sortedAgents);
    if (sortedAgents.length > 0) setSelectedAgent(sortedAgents[0]);

    // 加载地图
    if (LOCAL_MAPS.length > 0) {
      setMaps(LOCAL_MAPS);
      setSelectedMap(LOCAL_MAPS[0]);
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
