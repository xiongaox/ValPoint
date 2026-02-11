/**
 * MainView - 点位主视图
 *
 * 职责：
 * - 组织点位主视图的整体布局与关键区域。
 * - 协调路由、筛选或 Tab 等顶层状态。
 * - 整合数据来源与子组件的交互。
 */

import React, { useState, useMemo, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import LeafletMap from '../../components/LeafletMap';
import QuickActions from '../../components/QuickActions';
import LibrarySwitchButton from '../../components/LibrarySwitchButton';
import CompactUserCard from '../../components/CompactUserCard';
import UserAvatar from '../../components/UserAvatar';
import AuthorLinksBar from '../../components/AuthorLinksBar';
import Icon from '../../components/Icon';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import MobileAgentPicker from '../../components/MobileAgentPicker';
import MobileMapPicker from '../../components/MobileMapPicker';
import MobileLineupList from '../../components/MobileLineupList';
import { getAbilityList, getAbilityIcon } from '../../utils/abilityIcons';

import LeftPanel from '../../components/LeftPanel';
import RightPanel from '../../components/RightPanel';
import ICPFooter from '../../components/ICPFooter';
import { BaseLineup, SharedLineup, AgentOption, MapOption, NewLineupForm, LibraryMode } from '../../types/lineup';
import { ActiveTab } from '../../types/app';

type LeftProps = {
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
  getMapDisplayName: (name: string) => string;
  openChangelog: () => void;
  onReset?: () => void;
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
  onPngSettings?: () => void;
  onChangePassword: () => void;
  onClearLineups: () => void;
  onSyncToShared?: () => void;
  onPendingSubmissions?: () => void;
  onBatchDownload?: () => void;
  onProfile?: () => void;
  isAdmin?: boolean;
  pendingTransfers: number;
  canBatchDownload?: boolean;
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
  pinnedLineupIds: string[];
  onTogglePinLineup: (id: string) => void;
  pinnedLimit: number;
  onSubmitLineup?: (lineupId: string) => void;
  isAdmin?: boolean;
};

type Props = {
  activeTab: ActiveTab;
  clearSelection: () => void;
  left: LeftProps;
  map: MapProps;
  quickActions: QuickActionsProps;
  right: RightProps;
  hideSharedButton?: boolean;
  hideAuthorLinks?: boolean;
  user: User | null;
  onSignOut: () => void;
  onOpenProfile: () => void;
  userAvatarUrl?: string | null;
};

const MainView: React.FC<Props> = ({ activeTab, clearSelection, left, map, quickActions, right, hideSharedButton, hideAuthorLinks, user, onSignOut, onOpenProfile, userAvatarUrl }) => {
  const { isMobile, isTabletLandscape } = useDeviceMode();
  const isDesktop = !isMobile && !isTabletLandscape;
  const [isMobileAgentPickerOpen, setIsMobileAgentPickerOpen] = useState(false);
  const [isMobileMapPickerOpen, setIsMobileMapPickerOpen] = useState(false);
  const [isMobileLineupListOpen, setIsMobileLineupListOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false); // 说明：用户菜单状态。
  const [isTabletRightPanelOpen, setIsTabletRightPanelOpen] = useState(false);

  const [disabledAbilities, setDisabledAbilities] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isTabletLandscape) {
      setIsTabletRightPanelOpen(false);
    }
  }, [isTabletLandscape]);

  // 移动端：根据 disabledAbilities 过滤点位
  const filteredMapLineups = useMemo(() => {
    if (!isMobile || disabledAbilities.size === 0) {
      return map.lineups;
    }
    return map.lineups.filter(
      l => l.abilityIndex === null || l.abilityIndex === undefined || !disabledAbilities.has(l.abilityIndex)
    );
  }, [isMobile, disabledAbilities, map.lineups]);

  const sharedLibraryUrl = (window as any).__ENV__?.VITE_SHARED_LIBRARY_URL
    || import.meta.env.VITE_SHARED_LIBRARY_URL
    || '/';

  const deployPlatform = (window as any).__ENV__?.VITE_DEPLOY_PLATFORM
    || import.meta.env.VITE_DEPLOY_PLATFORM;

  return (
    <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
      {!isMobile && (
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
          onReset={left.onReset}
          layoutMode={isTabletLandscape ? 'tablet-compact' : 'desktop'}
        />
      )}

      <div className="flex-1 relative bg-[#0f1923] z-0 border-l border-r border-white/10">
        <LeafletMap
          mapIcon={map.mapIcon}
          mapCover={map.mapCover}
          disableFitBoundsAnimation={true}
          activeTab={map.activeTab}
          lineups={filteredMapLineups}
          selectedLineupId={map.selectedLineupId}
          onLineupSelect={(id) => {
            map.onLineupSelect(id);
            if (isTabletLandscape && id === null) {
              setIsTabletRightPanelOpen(false);
            }
          }}
          newLineupData={map.newLineupData}
          setNewLineupData={map.setNewLineupData}
          placingType={map.placingType}
          setPlacingType={(val) => map.setPlacingType(val as 'agent' | 'skill' | null)}
          selectedAgent={map.selectedAgent}
          selectedAbilityIndex={map.selectedAbilityIndex}
          onViewLineup={(id) => {
            map.onViewLineup(id);
            if (isTabletLandscape) {
              setIsTabletRightPanelOpen(false);
            }
          }}
          isFlipped={map.isFlipped}
        />

        {!isMobile && (
          <QuickActions
            isOpen={quickActions.isOpen}
            onToggle={quickActions.onToggle}
            onImageBedConfig={quickActions.onImageBedConfig}
            onAdvancedSettings={quickActions.onAdvancedSettings}
            onPngSettings={quickActions.onPngSettings}
            onChangePassword={quickActions.onChangePassword}
            onClearLineups={quickActions.onClearLineups}
            onSyncToShared={quickActions.onSyncToShared}
            onPendingSubmissions={quickActions.onPendingSubmissions}
            onBatchDownload={quickActions.onBatchDownload}
            onProfile={quickActions.onProfile}
            isAdmin={quickActions.isAdmin}
            pendingTransfers={quickActions.pendingTransfers}
            canBatchDownload={quickActions.canBatchDownload}
          />
        )}

        {!isMobile && (
          <>
            <div className="absolute top-3 left-3 z-10 flex items-center gap-3">
              <LibrarySwitchButton currentLibrary="personal" hideSharedButton={hideSharedButton} />
              <CompactUserCard
                user={user}
                onSignOut={onSignOut}
                onRequestLogin={onOpenProfile}
              />
            </div>
            {!hideAuthorLinks && (
              <div className="absolute top-3 right-3 z-10">
                <AuthorLinksBar />
              </div>
            )}
          </>
        )}

        {isMobile && (
          <>
            {/* 第一行：顶部 Tab 栏 */}
            <div className="absolute top-0 left-0 right-0 z-20 h-14 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4">
              {/* 左侧：Logo */}
              <a href="/" className="flex items-center gap-2">
                <img src="/logo.svg" alt="ValPoint" className="w-6 h-6" />
                <span className="text-white font-bold">ValPoint</span>
              </a>
              {/* 右侧：GitHub & Wiki */}
              <div className="flex items-center gap-4">
                {deployPlatform && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-400 border border-white/5">
                    {deployPlatform}
                  </span>
                )}
                <a
                  href="https://github.com/xiongaox/ValPoint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="GitHub"
                >
                  <Icon name="Github" size={20} />
                </a>
                <a
                  href="/wiki/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Wiki 文档"
                >
                  <Icon name="BookOpen" size={20} />
                </a>
              </div>
            </div>

            {/* 第二行：个人库/共享库 + 用户信息（原有内容下移） */}
            <div className="absolute top-16 left-3 z-10">
              <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5">
                <div className="px-4 h-[32px] flex items-center justify-center rounded-lg text-sm font-medium bg-[#ff4655] text-white">
                  个人库
                </div>
                <a
                  href={sharedLibraryUrl || '#'}
                  className="px-4 h-[32px] flex items-center justify-center rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white"
                >
                  共享库
                </a>
              </div>
            </div>

            <div className="absolute top-16 right-3 z-10 flex items-center gap-2">
              {/* 用户信息 */}
              <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5 items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="w-[32px] h-[32px] flex items-center justify-center rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
                  title="个人中心"
                >
                  <UserAvatar email={user?.email || ''} size={32} bordered={false} avatarUrl={userAvatarUrl} />
                </button>
                <button
                  onClick={onSignOut}
                  className="px-5 h-[32px] bg-[#ff4655] rounded-lg text-white text-sm font-medium hover:bg-[#ff5b6b] transition-colors"
                  title="退出登录"
                >
                  退出
                </button>
              </div>
              {/* 点位列表 */}
              <button
                onClick={() => setIsMobileLineupListOpen(true)}
                className="w-[46px] h-[46px] flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10"
                title="点位列表"
              >
                <Icon name="List" size={20} className="text-white" />
              </button>
            </div>

            <div className="absolute bottom-8 left-3 right-3 z-10 flex items-center justify-between gap-2">
              <button
                onClick={() => setIsMobileMapPickerOpen(true)}
                className="flex items-center gap-2 px-3 h-[46px] bg-black/60 backdrop-blur-sm rounded-xl border border-white/10"
              >
                <Icon name="Map" size={18} className="text-[#ff4655]" />
                <span className="text-white text-sm font-medium max-w-[70px] truncate">{left.getMapDisplayName(left.selectedMap?.displayName || '') || '地图'}</span>
              </button>

              <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5">
                <button
                  onClick={() => left.setSelectedSide('attack')}
                  className={`px-3 h-[32px] rounded-lg text-sm font-medium whitespace-nowrap transition-all ${left.selectedSide === 'attack'
                    ? 'bg-[#ff4655] text-white'
                    : 'text-gray-400'
                    }`}
                >
                  进攻
                </button>
                <button
                  onClick={() => left.setSelectedSide('defense')}
                  className={`px-4 h-[32px] rounded-lg text-sm font-medium whitespace-nowrap transition-all ${left.selectedSide === 'defense'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-400'
                    }`}
                >
                  防守
                </button>
              </div>

              <div className="flex bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-1.5">
                <button
                  onClick={() => setIsMobileAgentPickerOpen(true)}
                  className="flex items-center gap-2 px-1 h-[32px] rounded-lg"
                >
                  <img
                    src={left.selectedAgent?.displayIcon || `/agents/${left.selectedAgent?.displayName || 'default'}.webp`}
                    alt=""
                    className="w-7 h-7 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/agents/default.webp';
                    }}
                  />
                  <span className="text-white text-sm font-medium max-w-[60px] truncate">{left.selectedAgent?.displayName || '角色'}</span>
                </button>
              </div>
            </div>

            {left.selectedAgent && (
              <div className="absolute top-32 right-3.5 z-10 flex flex-col gap-4">
                {getAbilityList(left.selectedAgent).map((ability: any, idx: number) => {
                  const iconUrl = getAbilityIcon(left.selectedAgent!, idx);
                  const isDisabled = disabledAbilities.has(idx);
                  const isSelected = !isDisabled; // 说明：选中表示未禁用。
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setDisabledAbilities(prev => {
                          const next = new Set(prev);
                          if (next.has(idx)) {
                            next.delete(idx);
                          } else {
                            next.add(idx);
                          }
                          return next;
                        });
                      }}
                      className={`w-10 h-10 rounded-xl border-2 backdrop-blur-sm transition-all flex items-center justify-center ${isSelected
                        ? 'bg-[#ff4655] border-[#ff4655] shadow-lg shadow-red-500/30'
                        : 'bg-black/40 border-white/10 opacity-50'
                        }`}
                      title={ability.displayName || `技能${idx + 1}`}
                    >
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt=""
                          className={`w-6 h-6 object-contain ${isSelected ? 'brightness-0 invert' : ''}`}
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">{idx + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ICP 备案信息（仅桌面端，通过环境变量配置） */}
        {!isMobile && <ICPFooter />}

        {isTabletLandscape && (
          <>
            {isTabletRightPanelOpen && (
              <button
                onClick={() => setIsTabletRightPanelOpen(false)}
                className="absolute inset-0 z-30 bg-black/35"
                aria-label="关闭点位抽屉"
              />
            )}
            <button
              onClick={() => setIsTabletRightPanelOpen((v) => !v)}
              className="absolute top-1/2 -translate-y-1/2 right-3 z-50 h-12 w-12 rounded-xl border border-white/15 bg-black/60 backdrop-blur-sm flex items-center justify-center hover:border-[#ff4655]/70 transition-colors"
              title={isTabletRightPanelOpen ? '收起点位列表' : '展开点位列表'}
            >
              <Icon name={isTabletRightPanelOpen ? 'ChevronRight' : 'ChevronLeft'} size={20} className="text-white" />
            </button>
            <div className={`absolute top-0 right-0 bottom-0 z-40 transition-transform duration-300 ease-out ${isTabletRightPanelOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
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
                handleViewLineup={(id) => {
                  right.handleViewLineup(id);
                  setIsTabletRightPanelOpen(false);
                }}
                handleDownload={right.handleDownload}
                handleRequestDelete={right.handleRequestDelete}
                handleClearAll={right.handleClearAll}
                getMapDisplayName={right.getMapDisplayName}
                onOpenImportModal={right.onOpenImportModal}
                userId={right.userId}
                pinnedLineupIds={right.pinnedLineupIds}
                onTogglePinLineup={right.onTogglePinLineup}
                pinnedLimit={right.pinnedLimit}
                onSubmitLineup={right.onSubmitLineup}
                isAdmin={right.isAdmin}
                layoutMode="tablet-drawer"
              />
            </div>
          </>
        )}
      </div>

      {isDesktop && (
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
          pinnedLineupIds={right.pinnedLineupIds}
          onTogglePinLineup={right.onTogglePinLineup}
          pinnedLimit={right.pinnedLimit}
          onSubmitLineup={right.onSubmitLineup}
          isAdmin={right.isAdmin}
        />
      )}

      <MobileAgentPicker
        isOpen={isMobileAgentPickerOpen}
        onClose={() => setIsMobileAgentPickerOpen(false)}
        agents={left.agents}
        selectedAgent={left.selectedAgent}
        onSelect={(agent) => {
          left.setSelectedAgent(agent);
          if (agent) {
            left.setSelectedSide('attack');
          }
        }}
        agentCounts={left.agentCounts}
      />

      <MobileMapPicker
        isOpen={isMobileMapPickerOpen}
        onClose={() => setIsMobileMapPickerOpen(false)}
        maps={left.maps}
        selectedMap={left.selectedMap}
        onSelect={left.setSelectedMap}
      />

      <MobileLineupList
        isOpen={isMobileLineupListOpen}
        onClose={() => setIsMobileLineupListOpen(false)}
        lineups={right.filteredLineups}
        selectedLineupId={right.selectedLineupId}
        onSelectLineup={(id) => right.handleViewLineup(id)}
        pinnedLineupIds={right.pinnedLineupIds}
        onTogglePin={right.onTogglePinLineup}
      />
    </div>
  );
};

export default MainView;
