/**
 * useLineups - Hook 层
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
 * - `useLineups`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../services/lineups`、`../types/lineup`
 * - 下游影响：供组件与控制器复用
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
