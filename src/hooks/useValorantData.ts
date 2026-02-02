/**
 * useValorantData - ValorantData
 *
 * 职责：
 * - 封装ValorantData相关的状态与副作用。
 * - 对外提供稳定的接口与回调。
 * - 处理订阅、清理或缓存等生命周期细节。
 */

import { useEffect, useState } from 'react';
import { AgentData, MapOption } from '../types/lineup';
import { LOCAL_AGENTS } from '../data/localAgents';
import { LOCAL_MAPS } from '../data/localMaps';
import { fetchMapPoolConfig } from '../services/mapPoolService';

export function useValorantData() {
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedMap, setSelectedMap] = useState<MapOption | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    const sortedAgents = [...LOCAL_AGENTS].sort((a, b) => a.displayName.localeCompare(b.displayName));
    setAgents(sortedAgents);
    if (sortedAgents.length > 0) setSelectedAgent(sortedAgents[0]);

    // 初始化地图列表（先用本地数据）
    if (LOCAL_MAPS.length > 0) {
      setMaps(LOCAL_MAPS);
      setSelectedMap(LOCAL_MAPS[0]);
    }

    // 异步拉取数据库配置，合并 poolStatus
    fetchMapPoolConfig().then((poolConfig) => {
      if (Object.keys(poolConfig).length > 0) {
        const updatedMaps = LOCAL_MAPS.map((m) => ({
          ...m,
          poolStatus: poolConfig[m.displayName] || m.poolStatus || null,
        }));
        setMaps(updatedMaps);
        if (updatedMaps.length > 0) {
          setSelectedMap((prev) =>
            prev ? updatedMaps.find((m) => m.displayName === prev.displayName) || updatedMaps[0] : updatedMaps[0]
          );
        }
      }
    });
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
