import React, { useCallback, useMemo, useState } from 'react';
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

  // 切换地图时自动选择默认特工（第一个）
  const handleSelectMap = useCallback((map: MapOption | null) => {
    setSelectedMap(map);
    if (map && agents.length > 0) {
      setSelectedAgent(agents[0]);
    } else {
      setSelectedAgent(null);
    }
  }, [agents, setSelectedMap, setSelectedAgent]);

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
    setSelectedAgent,
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
    setSelectedAgent,
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
    isImageProcessingOpen,
    setIsImageProcessingOpen,
    imageProcessingSettings,
    handleImageBedConfig,
    handleOpenAdvancedSettings,
    handleChangePassword,
    handleQuickClear,
    handleImageConfigSave,
    handleImageProcessingSave,
  } = useActionMenu({
    userId,
    setAlertMessage: (msg) => modal.setAlertMessage(msg),
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
    setIsMapModalOpen: modal.setIsMapModalOpen,
    selectedSide,
    setSelectedSide,
    selectedAgent,
    setSelectedAgent,
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
    onBatchDownload: () => modal.setIsBatchDownloadModalOpen(true),
    user,
    onSignOut: signOut,
    onOpenProfile: () => setIsProfileModalOpen(true),
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
    isImageProcessingOpen,
    imageProcessingSettings,
    onImageProcessingSave: handleImageProcessingSave,
    setIsImageProcessingOpen,
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
