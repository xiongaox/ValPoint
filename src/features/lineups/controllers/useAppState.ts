/**
 * useAppState - Feature 控制器层
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
 * - `useAppState`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../../types/app`、`../../../types/lineup`、`../lineupHelpers`
 * - 下游影响：供 feature 入口控制器组合
 */

import { useState } from 'react';
import { ActiveTab } from '../../../types/app';
import { BaseLineup, LibraryMode, NewLineupForm, SharedLineup } from '../../../types/lineup';
import { createEmptyLineup } from '../lineupHelpers';
import { useDeviceMode } from '../../../hooks/useDeviceMode';

export function useAppState() {
  const { isMobile } = useDeviceMode();
  const [activeTab, setActiveTab] = useState<ActiveTab>('view');
  const [selectedSide, setSelectedSide] = useState<'all' | 'attack' | 'defense'>(() => isMobile ? 'attack' : 'all');
  const [selectedAbilityIndex, setSelectedAbilityIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);
  const [viewingLineup, setViewingLineup] = useState<BaseLineup | null>(null);
  const [editingLineupId, setEditingLineupId] = useState<string | null>(null);
  const [newLineupData, setNewLineupData] = useState<NewLineupForm>(createEmptyLineup());
  const [placingType, setPlacingType] = useState<'agent' | 'skill' | null>(null);

  return {
    activeTab,
    setActiveTab,
    selectedSide,
    setSelectedSide,
    selectedAbilityIndex,
    setSelectedAbilityIndex,
    searchQuery,
    setSearchQuery,
    selectedLineupId,
    setSelectedLineupId,
    viewingLineup,
    setViewingLineup,
    editingLineupId,
    setEditingLineupId,
    newLineupData,
    setNewLineupData,
    placingType,
    setPlacingType,
  };
}
