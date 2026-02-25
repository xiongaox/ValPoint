/**
 * useDeletionController - Feature 控制器层
 *
 * 模块定位：
 * - 所在层级：Feature 控制器层
 * - 主要目标：拆分点位业务流程与状态编排
 *
 * 关键职责：
 * - 按职责拆分点位业务控制器
 * - 组合状态、动作与生命周期逻辑
 * - 为视图层提供可直接消费的 props/handler
 *
 * 主要导出：
 * - `useDeletionController`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../../types/lineup`
 * - 下游影响：供 feature 入口控制器组合
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
