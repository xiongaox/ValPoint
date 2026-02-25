/**
 * useAppLifecycle - Feature 控制器层
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
 * - `useAppLifecycle`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../../types/app`、`../../../types/lineup`、`../lineupHelpers`
 * - 下游影响：供 feature 入口控制器组合
 */

import { useEffect } from 'react';
import { ActiveTab } from '../../../types/app';
import { BaseLineup, LibraryMode, NewLineupForm, SharedLineup } from '../../../types/lineup';
import { createEmptyLineup } from '../lineupHelpers';

type Params = {
  userId: string | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  fetchLineups: (userId: string) => void;
  setLineups: (val: BaseLineup[]) => void;
  setSelectedLineupId: (val: string | null) => void;
  setViewingLineup: (val: BaseLineup | null) => void;
  setEditingLineupId: (val: string | null) => void;
  setIsEditorOpen: (val: boolean) => void;
  setPlacingType: (val: 'agent' | 'skill' | null) => void;
  setNewLineupData: (val: NewLineupForm) => void;
  setAlertMessage: (msg: string) => void;
};

export function useAppLifecycle({
  userId,
  activeTab,
  setActiveTab,
  fetchLineups,
  setLineups,
  setSelectedLineupId,
  setViewingLineup,
  setEditingLineupId,
  setIsEditorOpen,
  setPlacingType,
  setNewLineupData,
  setAlertMessage,
}: Params) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('id')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setActiveTab]);

  useEffect(() => {
    if (!userId) return;
    fetchLineups(userId);
  }, [fetchLineups, userId]);

  useEffect(() => {
    if (!userId) return;
    setLineups([]);
    setSelectedLineupId(null);
    setViewingLineup(null);
    setEditingLineupId(null);
    setIsEditorOpen(false);
    setPlacingType(null);
    setNewLineupData(createEmptyLineup());
    setActiveTab('view');
  }, [
    setActiveTab,
    setEditingLineupId,
    setIsEditorOpen,
    setLineups,
    setNewLineupData,
    setPlacingType,
    setSelectedLineupId,
    setViewingLineup,
    userId,
  ]);
}
