/**
 * useLineupActions.ts - 点位操作逻辑 Hook
 * 
 * 职责：
 * - 封装点位的删除、归档及克隆（复制到个人库）等行为
 * - 处理操作后的 UI 反馈与列表刷新同步
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
