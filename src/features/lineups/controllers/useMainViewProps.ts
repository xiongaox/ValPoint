/**
 * useMainViewProps - Feature 控制器层
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
 * - `buildMainViewProps`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`@supabase/supabase-js`、`../MainView`、`../../../types/app`
 * - 下游影响：供 feature 入口控制器组合
 */

import React from 'react';
import { User } from '@supabase/supabase-js';
import MainView from '../MainView';
import { ActiveTab } from '../../../types/app';
import { AgentOption, BaseLineup, LibraryMode, MapOption, NewLineupForm, SharedLineup } from '../../../types/lineup';

type Params = {
  activeTab: ActiveTab;
  selectedMap: MapOption | null;
  setSelectedMap: (map: MapOption | null) => void; // 说明：用于移动端地图选择。
  maps: MapOption[]; // 说明：移动端地图列表。
  setIsMapModalOpen: (v: boolean) => void;
  selectedSide: 'all' | 'attack' | 'defense';
  setSelectedSide: React.Dispatch<React.SetStateAction<'all' | 'attack' | 'defense'>>;
  selectedAgent: AgentOption | null;
  setSelectedAgent: (v: AgentOption | null) => void;
  agents: AgentOption[];
  agentCounts: Record<string, number>;
  selectedAbilityIndex: number | null;
  setSelectedAbilityIndex: (v: number | null) => void;
  setIsPreviewModalOpen: (v: boolean) => void;
  setIsImportModalOpen: (v: boolean) => void;
  getMapDisplayName: (name: string) => string;
  openChangelog: () => void;
  mapIcon: string | null;
  mapCover: string | null;
  lineups: BaseLineup[];
  selectedLineupId: string | null;
  onLineupSelect: (id: string | null) => void;
  newLineupData: NewLineupForm;
  setNewLineupData: (fn: (prev: NewLineupForm) => NewLineupForm) => void;
  placingType: 'agent' | 'skill' | null;
  setPlacingType: React.Dispatch<React.SetStateAction<'agent' | 'skill' | null>>;
  onViewLineup: (id: string) => void;
  isFlipped: boolean;
  isActionMenuOpen: boolean;
  onToggleActions: () => void;
  onImageBedConfig: () => void;
  onAdvancedSettings: () => void;
  onPngSettings: () => void;
  onChangePassword: () => void;
  onClearLineups: () => void;
  onSyncToShared?: () => void;
  onPendingSubmissions?: () => void;
  isAdmin?: boolean;
  pendingTransfers: number;
  handleTabSwitch: (tab: ActiveTab) => void;
  togglePlacingType: (type: 'agent' | 'skill') => void;
  handleOpenEditor: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredLineups: BaseLineup[];
  selectedLineupIdRight: string | null;
  handleViewLineup: (id: string) => void;
  handleDownload: (id: string, e?: React.MouseEvent) => void;
  handleRequestDelete: (id: string, e?: React.MouseEvent) => void;
  handleClearAll: () => void;
  setSelectedLineupId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewingLineup: React.Dispatch<React.SetStateAction<BaseLineup | null>>;
  userId: string | null;
  pinnedLineupIds: string[];
  onTogglePinLineup: (id: string) => void;
  pinnedLimit: number;
  hideSharedButton?: boolean;
  hideAuthorLinks?: boolean;
  onBatchDownload: () => void;
  onSubmitLineup?: (lineupId: string) => void;
  user: User | null;
  onSignOut: () => void;
  onOpenProfile: () => void;
  canBatchDownload?: boolean;
  onReset?: () => void;
  userAvatarUrl?: string | null;
};

export function buildMainViewProps(params: Params): React.ComponentProps<typeof MainView> {
  return {
    activeTab: params.activeTab,

    clearSelection: () => {
      params.setSelectedLineupId(null);
      params.setViewingLineup(null);
    },
    left: {
      activeTab: params.activeTab,
      selectedMap: params.selectedMap,
      setSelectedMap: params.setSelectedMap, // 说明：用于移动端地图选择。
      maps: params.maps, // 说明：移动端地图列表。
      setIsMapModalOpen: params.setIsMapModalOpen,
      selectedSide: params.selectedSide,
      setSelectedSide: params.setSelectedSide,
      selectedAgent: params.selectedAgent,
      setSelectedAgent: params.setSelectedAgent,
      agents: params.agents,
      agentCounts: params.agentCounts,
      selectedAbilityIndex: params.selectedAbilityIndex,
      setSelectedAbilityIndex: params.setSelectedAbilityIndex,
      setIsPreviewModalOpen: params.setIsPreviewModalOpen,
      getMapDisplayName: params.getMapDisplayName,
      openChangelog: params.openChangelog,
      onReset: params.onReset,
    },
    map: {
      activeTab: params.activeTab,
      mapIcon: params.mapIcon,
      mapCover: params.mapCover,
      lineups: params.lineups,
      selectedLineupId: params.selectedLineupId,
      onLineupSelect: params.onLineupSelect,
      newLineupData: params.newLineupData,
      setNewLineupData: params.setNewLineupData,
      placingType: params.placingType,
      setPlacingType: params.setPlacingType,
      selectedAgent: params.selectedAgent,
      selectedAbilityIndex: params.selectedAbilityIndex,
      onViewLineup: params.onViewLineup,
      isFlipped: params.isFlipped,

    },
    quickActions: {
      isOpen: params.isActionMenuOpen,
      onToggle: params.onToggleActions,
      onImageBedConfig: params.onImageBedConfig,
      onAdvancedSettings: params.onAdvancedSettings,
      onPngSettings: params.onPngSettings,
      onChangePassword: params.onChangePassword,
      onClearLineups: params.onClearLineups,
      onSyncToShared: params.onSyncToShared,
      onPendingSubmissions: params.onPendingSubmissions,
      onBatchDownload: params.onBatchDownload,
      onProfile: params.onOpenProfile,
      isAdmin: params.isAdmin,
      pendingTransfers: params.pendingTransfers,
      canBatchDownload: params.canBatchDownload,
    },
    right: {
      activeTab: params.activeTab,
      handleTabSwitch: params.handleTabSwitch,
      selectedSide: params.selectedSide,
      setSelectedSide: params.setSelectedSide,
      placingType: params.placingType,
      togglePlacingType: params.togglePlacingType,
      newLineupData: params.newLineupData,
      handleOpenEditor: params.handleOpenEditor,
      searchQuery: params.searchQuery,
      setSearchQuery: params.setSearchQuery,
      filteredLineups: params.filteredLineups,
      selectedLineupId: params.selectedLineupIdRight,
      handleViewLineup: params.handleViewLineup,
      handleDownload: params.handleDownload,
      handleRequestDelete: params.handleRequestDelete,
      handleClearAll: params.handleClearAll,
      getMapDisplayName: params.getMapDisplayName,
      onOpenImportModal: () => params.setIsImportModalOpen(true),
      userId: params.userId,
      pinnedLineupIds: params.pinnedLineupIds,
      onTogglePinLineup: params.onTogglePinLineup,
      pinnedLimit: params.pinnedLimit,
      onSubmitLineup: params.onSubmitLineup,
      isAdmin: params.isAdmin,
    },
    hideSharedButton: params.hideSharedButton,
    hideAuthorLinks: params.hideAuthorLinks,
    user: params.user,
    onSignOut: params.onSignOut,
    onOpenProfile: params.onOpenProfile,
    userAvatarUrl: params.userAvatarUrl,
  };
}
