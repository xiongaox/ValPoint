/**
 * useAppState - 点位应用State
 *
 * 职责：
 * - 封装点位应用State相关的状态与副作用。
 * - 对外提供稳定的接口与回调。
 * - 处理订阅、清理或缓存等生命周期细节。
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
