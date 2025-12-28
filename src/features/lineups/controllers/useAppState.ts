import { useState } from 'react';
import { ActiveTab } from '../../../types/app';
import { BaseLineup, LibraryMode, NewLineupForm, SharedLineup } from '../../../types/lineup';
import { createEmptyLineup } from '../lineupHelpers';
import { useIsMobile } from '../../../hooks/useIsMobile';

export function useAppState() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<ActiveTab>('view');
  // 移动端默认进攻，桌面端默认全部
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
