import React from 'react';
import LeafletMap from '../../components/LeafletMap';
import QuickActions from '../../components/QuickActions';
import LibrarySwitch from '../../components/LibrarySwitch';
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
  sharedLineup: SharedLineup | null;
};

type QuickActionsProps = {
  isOpen: boolean;
  onToggle: () => void;
  onImageBedConfig: () => void;
  onAdvancedSettings: () => void;
  onChangePassword: () => void;
  onClearLineups: () => void;
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
  handleShare: (id: string, e?: React.MouseEvent) => void;
  handleRequestDelete: (id: string, e?: React.MouseEvent) => void;
  handleClearAll: () => void;
  getMapDisplayName: (name: string) => string;
  setIsPreviewModalOpen: (v: boolean) => void;
  userId: string | null;
  userMode: 'login' | 'guest';
  customUserIdInput: string;
  setCustomUserIdInput: (v: string) => void;
  handleApplyCustomUserId: () => void;
  handleResetUserId: () => void;
  libraryMode: LibraryMode;
  pinnedLineupIds: string[];
  onTogglePinLineup: (id: string) => void;
  pinnedLimit: number;
  onOpenSharedFilter: () => void;
  selectedSharedUserId: string | null;
};

type Props = {
  activeTab: ActiveTab;
  libraryMode: LibraryMode;
  setLibraryMode: React.Dispatch<React.SetStateAction<LibraryMode>>;
  clearSelection: () => void;
  left: LeftProps;
  map: MapProps;
  quickActions: QuickActionsProps;
  right: RightProps;
};

const MainView: React.FC<Props> = ({ activeTab, libraryMode, setLibraryMode, clearSelection, left, map, quickActions, right }) => {
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
          sharedLineup={map.sharedLineup}
        />
        <QuickActions
          isOpen={quickActions.isOpen}
          onToggle={quickActions.onToggle}
          onImageBedConfig={quickActions.onImageBedConfig}
          onAdvancedSettings={quickActions.onAdvancedSettings}
          onChangePassword={quickActions.onChangePassword}
          onClearLineups={quickActions.onClearLineups}
          pendingTransfers={quickActions.pendingTransfers}
        />
        {activeTab !== 'shared' && (
          <LibrarySwitch
            libraryMode={libraryMode}
            onSwitch={(mode) => {
              clearSelection();
              setLibraryMode(mode);
            }}
            sharedDisabled={activeTab === 'create'}
            disabledReason="创建模式仅支持个人库"
          />
        )}
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
        handleShare={right.handleShare}
        handleRequestDelete={right.handleRequestDelete}
        handleClearAll={right.handleClearAll}
        getMapDisplayName={right.getMapDisplayName}
        setIsPreviewModalOpen={right.setIsPreviewModalOpen}
        userId={right.userId}
        userMode={right.userMode}
        customUserIdInput={right.customUserIdInput}
        setCustomUserIdInput={right.setCustomUserIdInput}
        handleApplyCustomUserId={right.handleApplyCustomUserId}
        handleResetUserId={right.handleResetUserId}
        libraryMode={right.libraryMode}
        pinnedLineupIds={right.pinnedLineupIds}
        onTogglePinLineup={right.onTogglePinLineup}
        pinnedLimit={right.pinnedLimit}
        onOpenSharedFilter={right.onOpenSharedFilter}
        selectedSharedUserId={right.selectedSharedUserId}
      />
    </div>
  );
};

export default MainView;
