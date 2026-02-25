/**
 * useLineupActions - Hook 层
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
 * - `useLineupActions`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../services/lineups`、`../types/lineup`
 * - 下游影响：供组件与控制器复用
 */

import { useCallback } from 'react';
import { saveLineupApi, updateLineupApi, deleteLineupApi, clearLineupsApi, clearLineupsByAgentApi } from '../services/lineups';
import { LineupDbPayload, BaseLineup } from '../types/lineup';

export const useLineupActions = () => {
  const saveNewLineup = async (payload: LineupDbPayload): Promise<BaseLineup> => {
    return saveLineupApi(payload);
  };

  const updateLineup = async (id: string, payload: Partial<LineupDbPayload>) => {
    await updateLineupApi(id, payload);
  };

  const deleteLineup = async (id: string) => {
    await deleteLineupApi(id);
  };

  const clearLineups = async (userId: string) => {
    await clearLineupsApi(userId);
  };

  const clearLineupsByAgent = async (userId: string, agentName: string) => {
    await clearLineupsByAgentApi(userId, agentName);
  };

  return { saveNewLineup, updateLineup, deleteLineup, clearLineups, clearLineupsByAgent };
};
