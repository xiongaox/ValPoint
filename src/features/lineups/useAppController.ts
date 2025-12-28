/**
 * useAppController - 个人库应用主控制器
 * 
 * 整合所有子控制器和 hooks，作为个人库功能的中枢：
 * - 用户认证状态管理（Supabase Auth）
 * - 点位数据的 CRUD 操作
 * - 地图、特工、技能的选择和筛选
 * - 编辑器、弹窗、快捷操作的状态协调
 * - 置顶点位、批量下载等高级功能
 * 
 * 子控制器职责：
 * - useAppState: UI 状态（标签页、选中项、表单数据）
 * - useMapInfo: 地图信息和翻译
 * - useActionMenu: 快捷菜单和配置
 * - useEditorController: 点位编辑逻辑
 * - useDeletionController: 删除和清空逻辑
 * - useShareController: 共享库同步
 * - useViewController: 视图切换和预览
 */
/**
 * useAppController.ts - 全局应用状态主控制器
 * 
 * 职责：
 * - 协调地图选取、特工选取及点位过滤的顶级状态
 * - 管理全局弹窗（批下载、个人中心等）的开启与关闭
 * - 集成多个子 Hook 提供聚合的业务逻辑对象
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import { useLineups } from '../../hooks/useLineups';
import { useLineupActions } from '../../hooks/useLineupActions';
import { useValorantData } from '../../hooks/useValorantData';
import { useLineupFiltering } from '../../hooks/useLineupFiltering';
import { useModalState } from '../../hooks/useModalState';
import { usePinnedLineups } from '../../hooks/usePinnedLineups';
import { useLineupDownload } from '../../hooks/useLineupDownload';
import { AgentOption, BaseLineup, LibraryMode, SharedLineup, MapOption } from '../../types/lineup';
import { useMapInfo } from './controllers/useMapInfo';
import { useActionMenu } from './controllers/useActionMenu';
import { useAppLifecycle } from './controllers/useAppLifecycle';
import { useEditorController } from './controllers/useEditorController';
import { useDeletionController } from './controllers/useDeletionController';
import { useShareController } from './controllers/useShareController';
import { useViewController } from './controllers/useViewController';
import { buildMainViewProps } from './controllers/useMainViewProps';
import { buildModalProps } from './controllers/useModalProps';
import { buildUiProps } from './controllers/useUiProps';
import { useAppState } from './controllers/useAppState';
import { useUserProfile } from '../../hooks/useUserProfile';

/** 置顶点位数量上限 */
const DEFAULT_PINNED_COUNT = 8;

export function useAppController() {
  const {
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
  } = useAppState();

  const { maps, agents, selectedMap, setSelectedMap, selectedAgent, setSelectedAgent } = useValorantData();
  const modal = useModalState();
  const { mapNameZhToEn, getMapDisplayName, getMapEnglishName, getMapUrl, getMapCoverUrl } = useMapInfo({
    selectedMap,
    selectedSide,
  });
  // 使用 Supabase Auth 进行认证
  const { user, signOut } = useEmailAuth();
  // 将 Supabase UUID 作为用户 ID
  const userId = user?.id || null;
  const { profile, isLoading: profileLoading } = useUserProfile();



  // 个人信息弹窗状态
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  // 统一使用登录模式，不再支持游客模式
  const userMode = 'login' as const;
  const isGuest = false;
  // 旧认证弹窗相关状态（保留以兼容现有 UI）
  const isAuthModalOpen = false;
  const setIsAuthModalOpen = () => { };
  const pendingUserId = '';
  const setPendingUserId = () => { };
  const customUserIdInput = user?.user_metadata?.custom_id || '';
  const setCustomUserIdInput = () => { };
  const passwordInput = '';
  const setPasswordInput = () => { };
  const isAuthLoading = false;
  const targetUserId = userId || '';
  const handleApplyCustomUserId = () => { };
  const handleResetUserId = () => { };
  const handleConfirmUserAuth = async () => { };
  const { lineups, setLineups, fetchLineups } = useLineups(mapNameZhToEn);
  const { pinnedLineupIds, togglePinnedLineup, orderedLineups } = usePinnedLineups({
    userId,
    lineups,
  });
  const { handleDownload } = useLineupDownload({
    lineups: orderedLineups,
    setAlertMessage: modal.setAlertMessage,
  });
  const { saveNewLineup, updateLineup, deleteLineup, clearLineups, clearLineupsByAgent } = useLineupActions();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { agentCounts, filteredLineups, isFlipped, mapLineups, allMapLineups } = useLineupFiltering({
    lineups: orderedLineups,
    selectedMap,
    selectedAgent,
    selectedSide,
    selectedAbilityIndex,
    searchQuery,
  });

  // 切换特工时重置筛选
  const handleSelectAgent = useCallback((agent: AgentOption | null) => {
    setSelectedAgent(agent);
    setSelectedSide('all');
  }, [setSelectedAgent, setSelectedSide]);

  // 切换地图时自动选择默认特工（第一个）并重置筛选
  const handleSelectMap = useCallback((map: MapOption | null) => {
    setSelectedMap(map);
    setSelectedSide('all');
    if (map && agents.length > 0) {
      setSelectedAgent(agents[0]);
    } else {
      setSelectedAgent(null);
    }
  }, [agents, setSelectedMap, setSelectedAgent, setSelectedSide]);

  useAppLifecycle({
    userId,
    activeTab,
    setActiveTab,
    fetchLineups,
    setLineups,
    setSelectedLineupId,
    setViewingLineup,
    setEditingLineupId,
    setIsEditorOpen: modal.setIsEditorOpen,
    setPlacingType,
    setNewLineupData,
    setAlertMessage: modal.setAlertMessage,
  });

  const { handleTabSwitch, handlePreviewSubmit } = useViewController({
    isGuest,
    activeTab,
    agents,
    selectedAgent,
    selectedSide,
    setActiveTab,
    setPlacingType,
    setSelectedLineupId,
    setViewingLineup,
    setEditingLineupId,
    setNewLineupData,
    setSelectedSide,
    setSelectedAbilityIndex,
    setSelectedAgent: handleSelectAgent, // Use the wrapper here too if needed, but view controller typically handles tabs
    fetchLineups,
    userId,
    setAlertMessage: modal.setAlertMessage,
    setSelectedMap,
  });

  const { handleOpenEditor, handleEditorClose, handleEditStart, handleEditorSave } = useEditorController({
    isGuest,
    userId,
    activeTab,
    selectedMap,
    selectedAgent,
    selectedSide,
    selectedAbilityIndex,
    newLineupData,
    setNewLineupData,
    setSelectedSide,
    setSelectedAbilityIndex,
    setActiveTab,
    setPlacingType,
    setIsEditorOpen: modal.setIsEditorOpen,
    setEditingLineupId,
    setSelectedLineupId,
    setViewingLineup,
    setSelectedMap,
    setSelectedAgent: handleSelectAgent,
    maps,
    agents,
    getMapDisplayName,
    setAlertMessage: modal.setAlertMessage,
    fetchLineups,
    saveNewLineup,
    updateLineup,
    editingLineupId,
    lineups,
  });

  const { handleRequestDelete, performDelete, handleClearAll, performClearAll, performClearSelectedAgent } = useDeletionController({
    isGuest,
    userId,
    lineups,
    selectedAgent,
    deleteTargetId: modal.deleteTargetId,
    setDeleteTargetId: modal.setDeleteTargetId,
    setIsClearConfirmOpen: modal.setIsClearConfirmOpen,
    setAlertMessage: modal.setAlertMessage,
    deleteLineup,
    clearLineups,
    clearLineupsByAgent,
    setSelectedLineupId,
    setViewingLineup,
    fetchLineups,
  });

  const {
    isActionMenuOpen,
    setIsActionMenuOpen,
    isImageConfigOpen,
    setIsImageConfigOpen,
    imageBedConfig,
    isAdvancedSettingsOpen,
    setIsAdvancedSettingsOpen,
    isPngSettingsOpen,
    setIsPngSettingsOpen,
    imageProcessingSettings,
    handleImageBedConfig,
    handleOpenAdvancedSettings,
    handleOpenPngSettings,
    handleChangePassword,
    handleQuickClear,
    handleImageConfigSave,
    handleImageProcessingSave,
  } = useActionMenu({
    userId,
    setAlertMessage: (msg: string) => modal.setAlertMessage(msg),
    setIsAuthModalOpen,
    setPendingUserId,
    setCustomUserIdInput,
    setPasswordInput,
    handleClearAll,
    setIsChangePasswordOpen: modal.setIsChangePasswordOpen,
  });

  const { onSaveShared, isSavingShared, pendingTransfers } = useShareController({
    lineups,
    userId,
    isGuest,
    getMapEnglishName,
    setAlertMessage: modal.setAlertMessage,
    handleTabSwitch,
    setAlertActionLabel: modal.setAlertActionLabel,
    setAlertAction: modal.setAlertAction,
    setAlertSecondaryLabel: modal.setAlertSecondaryLabel,
    setAlertSecondaryAction: modal.setAlertSecondaryAction,
    imageBedConfig,
    saveNewLineup,
    fetchLineups,
    updateLineup,
  });

  const handleBatchDownload = useCallback(async (scope: 'agent' | 'map') => {
    if (!selectedMap) return;

    let targets: BaseLineup[] = [];
    if (scope === 'map') {
      targets = allMapLineups;
    } else {
      if (!selectedAgent) {
        modal.setAlertMessage('请先选择一个特工');
        return;
      }
      targets = allMapLineups.filter(l => l.agentName === selectedAgent.displayName);
    }

    if (targets.length === 0) {
      modal.setAlertMessage('当前范围内没有可下载的点位');
      return;
    }

    for (const lineup of targets) {
      await handleDownload(lineup.id);
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }, [selectedMap, selectedAgent, allMapLineups, handleDownload, modal]);

  // 使用 Supabase Auth 后，密码修改通过登录页面的"忘记密码"功能完成
  const handleChangePasswordSubmit = useCallback(
    async (_oldPassword: string, _newPassword: string, _confirmPassword: string) => {
      modal.setAlertMessage('请通过登录页面的"忘记密码"功能重置密码');
    },
    [modal],
  );

  const togglePlacingType = (type: 'agent' | 'skill') => {
    if (isGuest) {
      modal.setAlertMessage('游客模式无法标注点位，请先输入密码进入登录模式');
      return;
    }
    setPlacingType((prev) => (prev === type ? null : type));
  };

  const mainViewProps = buildMainViewProps({
    activeTab,
    selectedMap,
    setSelectedMap: handleSelectMap, // 新增：用于移动端地图选择
    maps, // 新增：地图列表
    setIsMapModalOpen: modal.setIsMapModalOpen,
    selectedSide,
    setSelectedSide,
    selectedAgent,
    setSelectedAgent: handleSelectAgent,
    agents,
    agentCounts,
    selectedAbilityIndex,
    setSelectedAbilityIndex,
    setIsPreviewModalOpen: modal.setIsPreviewModalOpen,
    setIsImportModalOpen: modal.setIsImportModalOpen,
    getMapDisplayName,
    openChangelog: () => modal.setIsChangelogOpen(true),
    mapIcon: getMapUrl(),
    mapCover: getMapCoverUrl(),
    lineups: mapLineups,
    selectedLineupId,
    onLineupSelect: setSelectedLineupId,
    newLineupData,
    setNewLineupData,
    placingType,
    setPlacingType,
    onViewLineup: (id: string) => {
      setSelectedLineupId(id);
      const lineup = orderedLineups.find((l) => l.id === id);
      if (lineup) setViewingLineup(lineup);
    },
    isFlipped,
    isActionMenuOpen,
    onToggleActions: () => setIsActionMenuOpen((v) => !v),
    onImageBedConfig: handleImageBedConfig,
    onAdvancedSettings: handleOpenAdvancedSettings,
    onPngSettings: handleOpenPngSettings,
    onChangePassword: handleChangePassword,
    onClearLineups: handleQuickClear,
    pendingTransfers,
    handleTabSwitch,
    togglePlacingType,
    handleOpenEditor,
    searchQuery,
    setSearchQuery,
    filteredLineups,
    selectedLineupIdRight: selectedLineupId,
    handleViewLineup: (id: string) => {
      setSelectedLineupId(id);
      const lineup = orderedLineups.find((l) => l.id === id);
      if (lineup) setViewingLineup(lineup);
    },
    handleDownload,
    handleRequestDelete,
    handleClearAll,
    setSelectedLineupId,
    setViewingLineup,
    userId,
    pinnedLineupIds,
    onTogglePinLineup: togglePinnedLineup,
    pinnedLimit: DEFAULT_PINNED_COUNT,
    hideSharedButton: imageProcessingSettings.hideSharedButton,
    hideAuthorLinks: imageProcessingSettings.hideAuthorLinks,
    onBatchDownload: () => modal.setIsBatchDownloadModalOpen(true),
    user,
    onSignOut: signOut,
    onOpenProfile: () => setIsProfileModalOpen(true),
    canBatchDownload: profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.can_batch_download,
  });

  const modalProps = buildModalProps({
    isAuthModalOpen,
    userId,
    targetUserId,
    passwordInput,
    isAuthLoading,
    setIsAuthModalOpen,
    setPendingUserId,
    setPasswordInput,
    setCustomUserIdInput,
    handleResetUserId,
    handleConfirmUserAuth,
    handleApplyCustomUserId,
    isMapModalOpen: modal.isMapModalOpen,
    maps,
    selectedMap,
    setSelectedMap: handleSelectMap,
    setIsMapModalOpen: modal.setIsMapModalOpen,
    getMapDisplayName,
    isPreviewModalOpen: modal.isPreviewModalOpen,
    previewInput: modal.previewInput,
    setPreviewInput: modal.setPreviewInput,
    onPreviewSubmit: handlePreviewSubmit,
    setIsPreviewModalOpen: modal.setIsPreviewModalOpen,
    alertMessage: modal.alertMessage,
    alertActionLabel: modal.alertActionLabel,
    alertAction: modal.alertAction,
    alertSecondaryLabel: modal.alertSecondaryLabel,
    alertSecondaryAction: modal.alertSecondaryAction,
    setAlertMessage: modal.setAlertMessage,
    setAlertActionLabel: modal.setAlertActionLabel,
    setAlertAction: modal.setAlertAction,
    setAlertSecondaryLabel: modal.setAlertSecondaryLabel,
    setAlertSecondaryAction: modal.setAlertSecondaryAction,
    deleteTargetId: modal.deleteTargetId,
    isClearConfirmOpen: modal.isClearConfirmOpen,
    performDelete,
    performClearAll,
    performClearSelectedAgent,
    setDeleteTargetId: modal.setDeleteTargetId,
    setIsClearConfirmOpen: modal.setIsClearConfirmOpen,
    selectedAgentName: selectedAgent?.displayName ?? null,
    selectedAgentIcon: selectedAgent?.displayIcon ?? null,
    isImageConfigOpen,
    imageBedConfig,
    onImageConfigSave: handleImageConfigSave,
    setIsImageConfigOpen,
    isAdvancedSettingsOpen,
    setIsAdvancedSettingsOpen,
    isPngSettingsOpen,
    setIsPngSettingsOpen,
    imageProcessingSettings,
    onImageProcessingSave: handleImageProcessingSave,
    isEditorOpen: modal.isEditorOpen,
    editingLineupId,
    newLineupData,
    setNewLineupData,
    handleEditorSave,
    handleEditorClose,
    selectedSide,
    setSelectedSide,
    viewingLineup,
    setViewingLineup,
    setSelectedLineupId,
    handleEditStart,
    setViewingImage: modal.setViewingImage,
    getMapEnglishName,
    isGuest,
    isChangePasswordOpen: modal.isChangePasswordOpen,
    setIsChangePasswordOpen: modal.setIsChangePasswordOpen,
    isChangingPassword,
    onChangePasswordSubmit: handleChangePasswordSubmit,
    viewingImage: modal.viewingImage,
    isChangelogOpen: modal.isChangelogOpen,
    setIsChangelogOpen: modal.setIsChangelogOpen,
    isImportModalOpen: modal.isImportModalOpen,
    setIsImportModalOpen: modal.setIsImportModalOpen,
    saveNewLineup,
    fetchLineups,
    lineups,
    isBatchDownloadModalOpen: modal.isBatchDownloadModalOpen,
    onBatchDownloadClose: () => modal.setIsBatchDownloadModalOpen(false),
    handleBatchDownload,
    totalMapLineups: allMapLineups.length,
    totalAgentLineups: selectedAgent ? allMapLineups.filter(l => l.agentName === selectedAgent.displayName).length : 0,
  });

  const { alertProps, lightboxProps } = buildUiProps({
    alertMessage: modal.alertMessage,
    alertActionLabel: modal.alertActionLabel,
    alertAction: modal.alertAction,
    alertSecondaryLabel: modal.alertSecondaryLabel,
    alertSecondaryAction: modal.alertSecondaryAction,
    setAlertMessage: modal.setAlertMessage,
    setAlertActionLabel: modal.setAlertActionLabel,
    setAlertAction: modal.setAlertAction,
    setAlertSecondaryLabel: modal.setAlertSecondaryLabel,
    setAlertSecondaryAction: modal.setAlertSecondaryAction,
    viewingImage: modal.viewingImage,
    setViewingImage: modal.setViewingImage,
  });

  return {
    activeTab,
    mainViewProps,
    modalProps,
    isProfileModalOpen,
    setIsProfileModalOpen,
    orderedLineups,  // 暴露点位列表供 UserApp 直接投稿用
  };
}
