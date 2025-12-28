/**
 * MainView.tsx - 共享库主导航视图
 * 
 * 职责：
 * - 渲染首页顶部的地图切换与特工选取区域
 * - 集成点位列表展示 (LineupGrid)
 * - 与 useAppController 通信以同步选取状态
 */
import React, { useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import LeafletMap from '../../components/LeafletMap';
import QuickActions from '../../components/QuickActions';
import LibrarySwitchButton from '../../components/LibrarySwitchButton';
import CompactUserCard from '../../components/CompactUserCard';
import AuthorLinksBar from '../../components/AuthorLinksBar';
import Icon from '../../components/Icon';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useUserProfile } from '../../hooks/useUserProfile';
import MobileAgentPicker from '../../components/MobileAgentPicker';
import MobileMapPicker from '../../components/MobileMapPicker';
import MobileLineupList from '../../components/MobileLineupList';
import { getAbilityList, getAbilityIcon } from '../../utils/abilityIcons';

import LeftPanel from '../../components/LeftPanel';
import RightPanel from '../../components/RightPanel';
import { BaseLineup, SharedLineup, AgentOption, MapOption, NewLineupForm, LibraryMode } from '../../types/lineup';
import { ActiveTab } from '../../types/app';

type LeftProps = {
  activeTab: ActiveTab;
  selectedMap: MapOption | null;
  setSelectedMap: (map: MapOption | null) => void; // 新增：用于移动端地图选择
  maps: MapOption[]; // 新增：地图列表
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
};

const MainView: React.FC<Props> = ({ activeTab, clearSelection, left, map, quickActions, right, hideSharedButton, hideAuthorLinks, user, onSignOut, onOpenProfile }) => {
  const isMobile = useIsMobile();
  const { profile } = useUserProfile(); // 获取用户资料
  const [isMobileAgentPickerOpen, setIsMobileAgentPickerOpen] = useState(false);
  const [isMobileMapPickerOpen, setIsMobileMapPickerOpen] = useState(false);
  const [isMobileLineupListOpen, setIsMobileLineupListOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false); // 用户下拉菜单

  // 移动端技能过滤（存储被禁用的技能索引）
  const [disabledAbilities, setDisabledAbilities] = useState<Set<number>>(new Set());

  // 获取共享库URL用于切换
  const sharedLibraryUrl = (window as any).__ENV__?.VITE_SHARED_LIBRARY_URL
    || import.meta.env.VITE_SHARED_LIBRARY_URL
    || '';

  return (
    <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
      {/* 左侧面板 - 仅桌面端 */}
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
        />
      )}

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

        {/* 桌面端：快捷操作按钮 */}
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

        {/* 桌面端：左上角库切换 + 用户卡片 */}
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
            {/* 作者信息快捷按钮 (右上角) */}
            {!hideAuthorLinks && (
              <div className="absolute top-3 right-3 z-10">
                <AuthorLinksBar />
              </div>
            )}
          </>
        )}

        {/* 移动端布局 */}
        {isMobile && (
          <>
            {/* 左上角：库切换 Tab（移动端样式） */}
            <div className="absolute top-3 left-3 z-10">
              <div className="flex bg-black/60 backdrop-blur-sm rounded-full border border-white/10 p-1.5">
                <div className="px-4 h-[32px] flex items-center justify-center rounded-full text-sm font-medium bg-[#ff4655] text-white">
                  个人库
                </div>
                <a
                  href={sharedLibraryUrl || '#'}
                  className="px-4 h-[32px] flex items-center justify-center rounded-full text-sm font-medium transition-all text-gray-400 hover:text-white"
                >
                  共享库
                </a>
              </div>
            </div>

            {/* 右上角：用户胶囊按钮 + 列表按钮 */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <div className="flex bg-black/60 backdrop-blur-sm rounded-full border border-white/10 p-1.5 items-center gap-2">
                {/* 左侧：头像 → 个人中心 */}
                <button
                  onClick={onOpenProfile}
                  className="w-[32px] h-[32px] flex items-center justify-center rounded-full overflow-hidden hover:bg-white/10 transition-colors"
                  title="个人中心"
                >
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar.startsWith('/') || profile.avatar.startsWith('http') ? profile.avatar : `/agents/${profile.avatar}`}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={`text-white text-xs font-bold ${profile?.avatar ? 'hidden' : ''}`}>
                    {(profile?.nickname || profile?.custom_id || user?.email)?.[0]?.toUpperCase() || 'U'}
                  </span>
                </button>
                {/* 右侧：退出按钮 - 红色选中状态 */}
                <button
                  onClick={onSignOut}
                  className="px-5 h-[32px] bg-[#ff4655] rounded-full text-white text-sm font-medium hover:bg-[#ff5b6b] transition-colors"
                  title="退出登录"
                >
                  退出
                </button>
              </div>
              <button
                onClick={() => setIsMobileLineupListOpen(true)}
                className="w-[46px] h-[46px] flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/10"
                title="点位列表"
              >
                <Icon name="List" size={20} className="text-white" />
              </button>
            </div>

            {/* 底部工具栏：地图 | 攻防 | 角色 */}
            <div className="absolute bottom-12 left-3 right-3 z-10 flex items-center justify-between gap-2">
              {/* 左侧：地图选择 */}
              <button
                onClick={() => setIsMobileMapPickerOpen(true)}
                className="flex items-center gap-2 px-4 h-[46px] bg-black/60 backdrop-blur-sm rounded-full border border-white/10"
              >
                <Icon name="Map" size={18} className="text-[#ff4655]" />
                <span className="text-white text-sm font-medium max-w-[70px] truncate">{left.getMapDisplayName(left.selectedMap?.displayName || '') || '地图'}</span>
              </button>

              {/* 中间：攻防切换 */}
              <div className="flex bg-black/60 backdrop-blur-sm rounded-full border border-white/10 p-1.5">
                <button
                  onClick={() => left.setSelectedSide('attack')}
                  className={`px-3 h-[32px] rounded-full text-sm font-medium whitespace-nowrap transition-all ${left.selectedSide === 'attack'
                    ? 'bg-[#ff4655] text-white'
                    : 'text-gray-400'
                    }`}
                >
                  进攻
                </button>
                <button
                  onClick={() => left.setSelectedSide('defense')}
                  className={`px-4 h-[32px] rounded-full text-sm font-medium whitespace-nowrap transition-all ${left.selectedSide === 'defense'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-400'
                    }`}
                >
                  防守
                </button>
              </div>

              {/* 右侧：角色选择 */}
              <div className="flex bg-black/60 backdrop-blur-sm rounded-full border border-white/10 p-1.5">
                <button
                  onClick={() => setIsMobileAgentPickerOpen(true)}
                  className="flex items-center gap-2 px-2 h-[32px] rounded-full"
                >
                  <img
                    src={left.selectedAgent?.displayIcon || `/agents/${left.selectedAgent?.displayName || 'default'}.webp`}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/agents/default.webp';
                    }}
                  />
                  <span className="text-white text-sm font-medium max-w-[60px] truncate">{left.selectedAgent?.displayName || '角色'}</span>
                </button>
              </div>
            </div>

            {/* 右上角：技能过滤图标（点位列表下方）*/}
            {left.selectedAgent && (
              <div className="absolute top-20 right-3.5 z-10 flex flex-col gap-4">
                {getAbilityList(left.selectedAgent).map((ability: any, idx: number) => {
                  const iconUrl = getAbilityIcon(left.selectedAgent!, idx);
                  const isDisabled = disabledAbilities.has(idx);
                  const isSelected = !isDisabled; // 选中 = 未禁用
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
                      className={`w-10 h-10 rounded-full border-2 backdrop-blur-sm transition-all flex items-center justify-center ${isSelected
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
      </div>

      {/* 右侧面板 - 仅桌面端 */}
      {!isMobile && (
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

      {/* 移动端弹窗组件 */}
      <MobileAgentPicker
        isOpen={isMobileAgentPickerOpen}
        onClose={() => setIsMobileAgentPickerOpen(false)}
        agents={left.agents}
        selectedAgent={left.selectedAgent}
        onSelect={left.setSelectedAgent}
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
      />
    </div>
  );
};

export default MainView;
