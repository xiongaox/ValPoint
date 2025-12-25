/**
 * useLineups - 点位数据 Hook
 * 
 * 管理用户的个人点位数据：
 * - 点位列表状态
 * - 从服务端获取点位
 */
/**
 * useLineups.ts - 点位数据获取 Hook
 * 
 * 职责：
 * - 负责从外部 API (Share DB) 异步加载所有共享点位
 * - 实现点位数据的本地缓存映射
 * - 处理数据加载时的 Loading 状态
 */
import { useCallback, useState } from 'react';
import { fetchLineupsApi } from '../services/lineups';
import { BaseLineup } from '../types/lineup';

export const useLineups = (mapNameZhToEn: Record<string, string>) => {
  const [lineups, setLineups] = useState<BaseLineup[]>([]);

  const fetchLineups = useCallback(
    async (userId: string | null) => {
      if (!userId) return;
      const list = await fetchLineupsApi(userId, mapNameZhToEn);
      setLineups(list);
    },
    [mapNameZhToEn],
  );

  return { lineups, setLineups, fetchLineups };
};
