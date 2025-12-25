/**
 * useDeletionController - 点位删除控制器
 * 
 * 处理点位删除和清空操作：
 * - handleRequestDelete: 请求删除单个点位
 * - performDelete: 执行删除
 * - handleClearAll: 请求清空所有点位
 * - performClearAll: 执行清空所有点位
 * - performClearSelectedAgent: 清空当前选中特工的点位
 */
import React from 'react';
import { AgentOption, BaseLineup } from '../../../types/lineup';

type Params = {
  isGuest: boolean;
  userId: string | null;
  lineups: BaseLineup[];
  selectedAgent: AgentOption | null;
  deleteTargetId: string | null;
  setDeleteTargetId: (id: string | null) => void;
  setIsClearConfirmOpen: (open: boolean) => void;
  setAlertMessage: (msg: string) => void;
  deleteLineup: (id: string) => Promise<void>;
  clearLineups: (userId: string) => Promise<void>;
  clearLineupsByAgent: (userId: string, agentName: string) => Promise<void>;
  setSelectedLineupId: (id: string | null) => void;
  setViewingLineup: (lineup: BaseLineup | null) => void;
  fetchLineups: (userId: string) => void;
};

export function useDeletionController({
  isGuest,
  userId,
  lineups,
  selectedAgent,
  deleteTargetId,
  setDeleteTargetId,
  setIsClearConfirmOpen,
  setAlertMessage,
  deleteLineup,
  clearLineups,
  clearLineupsByAgent,
  setSelectedLineupId,
  setViewingLineup,
  fetchLineups,
}: Params) {
  const handleRequestDelete = (id: string, e?: React.MouseEvent) => {
    if (isGuest) {
      e?.stopPropagation();
      setAlertMessage('游客模式无法删除点位，请先输入密码切换到登录模式');
      return;
    }
    e?.stopPropagation();
    setDeleteTargetId(id);
  };

  const performDelete = async () => {
    if (isGuest) {
      setAlertMessage('游客模式无法删除点位，请先输入密码切换到登录模式');
      return;
    }
    if (!deleteTargetId) return;
    try {
      await deleteLineup(deleteTargetId);
      setSelectedLineupId(null);
      setViewingLineup(null);
    } catch (e) {
      setAlertMessage('删除失败，请重试。');
    }
    setDeleteTargetId(null);
    fetchLineups(userId || '');
  };

  const handleClearAll = () => {
    if (isGuest) {
      setAlertMessage('游客模式无法删除点位，请先输入密码切换到登录模式');
      return;
    }
    if (!lineups.length) {
      setAlertMessage('当前没有可删除的点位。');
      return;
    }
    setIsClearConfirmOpen(true);
  };

  const performClearAll = async () => {
    if (!userId) return;
    try {
      await clearLineups(userId);
      setIsClearConfirmOpen(false);
      setSelectedLineupId(null);
      setViewingLineup(null);
      setAlertMessage('已清空当前账号的点位。');
      fetchLineups(userId);
    } catch (e) {
      setAlertMessage('清空失败，请重试。');
    }
  };

  const performClearSelectedAgent = async () => {
    if (!userId) return;
    if (!selectedAgent?.displayName) {
      setAlertMessage('请先选择一个英雄，以清空对应点位。');
      return;
    }
    try {
      await clearLineupsByAgent(userId, selectedAgent.displayName);
      setIsClearConfirmOpen(false);
      setSelectedLineupId(null);
      setViewingLineup(null);
      setAlertMessage(`已清空以 ${selectedAgent.displayName} 为英雄的点位。`);
      fetchLineups(userId);
    } catch (e) {
      setAlertMessage('清空失败，请重试。');
    }
  };

  return {
    handleRequestDelete,
    performDelete,
    handleClearAll,
    performClearAll,
    performClearSelectedAgent,
  };
}
