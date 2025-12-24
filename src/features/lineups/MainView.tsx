import React from 'react';
import LeafletMap from '../../components/LeafletMap';
import QuickActions from '../../components/QuickActions';
import LibrarySwitchButton from '../../components/LibrarySwitchButton';

import LeftPanel from '../../components/LeftPanel';
import RightPanel from '../../components/RightPanel';
import { BaseLineup, SharedLineup, AgentOption, MapOption, NewLineupForm, LibraryMode } from '../../types/lineup';
import { ActiveTab } from '../../types/app';

type LeftProps = {
  activeTab: ActiveTab;
  selectedMap: MapOption | null;
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
  getMapDisplayName: (name: string) => string;
  openChangelog: () => void;
};

type MapProps = {
  activeTab: ActiveTab;
  mapIcon: string | null;
  mapCover: string | null;
  lineups: BaseLineup[];
  selectedLineupId: string | null;
  onLineupSelect: (id: string | null) => void;
  newLineupData: NewLineupForm;
  setNewLineupData: (fn: (prev: NewLineupForm) => NewLineupForm) => void;
  placingType: 'agent' | 'skill' | null;
  setPlacingType: React.Dispatch<React.SetStateAction<'agent' | 'skill' | null>>;
  selectedAgent: AgentOption | null;
  selectedAbilityIndex: number | null;
  onViewLineup: (id: string) => void;
  isFlipped: boolean;
};

type QuickActionsProps = {
  isOpen: boolean;
  onToggle: () => void;
  onImageBedConfig: () => void;
  onAdvancedSettings: () => void;
  onChangePassword: () => void;
  onClearLineups: () => void;
  onSyncToShared?: () => void;
  onBatchDownload?: () => void;
  isAdmin?: boolean;
  pendingTransfers: number;
};

type RightProps = {
  activeTab: ActiveTab;
  handleTabSwitch: (tab: ActiveTab) => void;
  selectedSide: 'all' | 'attack' | 'defense';
  setSelectedSide: React.Dispatch<React.SetStateAction<'all' | 'attack' | 'defense'>>;
  placingType: 'agent' | 'skill' | null;
  togglePlacingType: (type: 'agent' | 'skill') => void;
  newLineupData: NewLineupForm;
  handleOpenEditor: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredLineups: BaseLineup[];
  selectedLineupId: string | null;
  handleViewLineup: (id: string) => void;
  handleDownload: (id: string, e?: React.MouseEvent) => void;
  handleRequestDelete: (id: string, e?: React.MouseEvent) => void;
  handleClearAll: () => void;
  getMapDisplayName: (name: string) => string;
  onOpenImportModal: () => void;
  userId: string | null;
  userMode: 'login' | 'guest';
  customUserIdInput: string;
  setCustomUserIdInput: (v: string) => void;
  handleApplyCustomUserId: () => void;
  handleResetUserId: () => void;
  pinnedLineupIds: string[];
  onTogglePinLineup: (id: string) => void;
  pinnedLimit: number;
};

type Props = {
  activeTab: ActiveTab;
  clearSelection: () => void;
  left: LeftProps;
  map: MapProps;
  quickActions: QuickActionsProps;
  right: RightProps;
  hideSharedButton?: boolean;
};

const MainView: React.FC<Props> = ({ activeTab, clearSelection, left, map, quickActions, right, hideSharedButton }) => {
  return (
    <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
      <LeftPanel
        activeTab={left.activeTab}
        selectedMap={left.selectedMap}
        setIsMapModalOpen={left.setIsMapModalOpen}
        selectedSide={left.selectedSide}
        setSelectedSide={(val) => left.setSelectedSide(val as 'all' | 'attack' | 'defense')}
        selectedAgent={left.selectedAgent}
        setSelectedAgent={left.setSelectedAgent}
        agents={left.agents}
        agentCounts={left.agentCounts}
        selectedAbilityIndex={left.selectedAbilityIndex}
        setSelectedAbilityIndex={left.setSelectedAbilityIndex}
        setIsPreviewModalOpen={left.setIsPreviewModalOpen}
        getMapDisplayName={left.getMapDisplayName}
        openChangelog={left.openChangelog}
      />

      <div className="flex-1 relative bg-[#0f1923] z-0 border-l border-r border-white/10">
        <LeafletMap
          mapIcon={map.mapIcon}
          mapCover={map.mapCover}
          activeTab={map.activeTab}
          lineups={map.lineups}
          selectedLineupId={map.selectedLineupId}
          onLineupSelect={map.onLineupSelect}
          newLineupData={map.newLineupData}
          setNewLineupData={map.setNewLineupData}
          placingType={map.placingType}
          setPlacingType={(val) => map.setPlacingType(val as 'agent' | 'skill' | null)}
          selectedAgent={map.selectedAgent}
          selectedAbilityIndex={map.selectedAbilityIndex}
          onViewLineup={map.onViewLineup}
          isFlipped={map.isFlipped}
        />
        <QuickActions
          isOpen={quickActions.isOpen}
          onToggle={quickActions.onToggle}
          onImageBedConfig={quickActions.onImageBedConfig}
          onAdvancedSettings={quickActions.onAdvancedSettings}
          onChangePassword={quickActions.onChangePassword}
          onClearLineups={quickActions.onClearLineups}
          onSyncToShared={quickActions.onSyncToShared}
          onBatchDownload={quickActions.onBatchDownload}
          isAdmin={quickActions.isAdmin}
          pendingTransfers={quickActions.pendingTransfers}
        />
        {/* 库切换按钮 */}
        <div className="absolute top-3 left-3 z-10">
          <LibrarySwitchButton currentLibrary="personal" hideSharedButton={hideSharedButton} />
        </div>
      </div>

      <RightPanel
        activeTab={right.activeTab}
        handleTabSwitch={(tab) => right.handleTabSwitch(tab as ActiveTab)}
        selectedSide={right.selectedSide}
        setSelectedSide={(val) => right.setSelectedSide(val as 'all' | 'attack' | 'defense')}
        placingType={right.placingType}
        togglePlacingType={(type) => right.togglePlacingType(type as 'agent' | 'skill')}
        newLineupData={right.newLineupData}
        handleOpenEditor={right.handleOpenEditor}
        searchQuery={right.searchQuery}
        setSearchQuery={right.setSearchQuery}
        filteredLineups={right.filteredLineups}
        selectedLineupId={right.selectedLineupId}
        handleViewLineup={right.handleViewLineup}
        handleDownload={right.handleDownload}
        handleRequestDelete={right.handleRequestDelete}
        handleClearAll={right.handleClearAll}
        getMapDisplayName={right.getMapDisplayName}
        onOpenImportModal={right.onOpenImportModal}
        userId={right.userId}
        userMode={right.userMode}
        customUserIdInput={right.customUserIdInput}
        setCustomUserIdInput={right.setCustomUserIdInput}
        handleApplyCustomUserId={right.handleApplyCustomUserId}
        handleResetUserId={right.handleResetUserId}
        pinnedLineupIds={right.pinnedLineupIds}
        onTogglePinLineup={right.onTogglePinLineup}
        pinnedLimit={right.pinnedLimit}
      />
    </div>
  );
};

export default MainView;
