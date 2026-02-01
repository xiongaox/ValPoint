/**
 * useModalProps - 点位弹窗Props
 *
 * 职责：
 * - 封装点位弹窗Props相关的状态与副作用。
 * - 对外提供稳定的接口与回调。
 * - 处理订阅、清理或缓存等生命周期细节。
 */

import React from 'react';
import AppModals from '../AppModals';
import { MapOption, NewLineupForm, SharedLineup, BaseLineup, LibraryMode, LineupDbPayload, AgentOption } from '../../../types/lineup';
import { ImageBedConfig } from '../../../types/imageBed';
import { ImageProcessingSettings } from '../../../types/imageProcessing';
import { LightboxImage } from '../../../types/ui';

type Params = {
  isAuthModalOpen: boolean;
  userId: string | null;
  targetUserId: string;
  passwordInput: string;
  isAuthLoading: boolean;
  setIsAuthModalOpen: (v: boolean) => void;
  setPendingUserId: (v: string) => void;
  setPasswordInput: (v: string) => void;
  setCustomUserIdInput: (v: string) => void;
  handleResetUserId: () => void;
  handleConfirmUserAuth: (pwd?: string) => void;
  handleApplyCustomUserId: () => void;
  isMapModalOpen: boolean;
  maps: MapOption[];
  selectedMap: MapOption | null;
  selectedAgent: AgentOption | null;
  selectedAbilityIndex: number | null;
  setSelectedMap: (v: MapOption | null) => void;
  setIsMapModalOpen: (v: boolean) => void;
  getMapDisplayName: (name: string) => string;
  isPreviewModalOpen: boolean;
  previewInput: string;
  setPreviewInput: (v: string) => void;
  onPreviewSubmit: () => void;
  setIsPreviewModalOpen: (v: boolean) => void;
  alertMessage: string | null;
  alertActionLabel: string | null;
  alertAction: (() => void) | null;
  alertSecondaryLabel: string | null;
  alertSecondaryAction: (() => void) | null;
  setAlertMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setAlertActionLabel: (v: string | null) => void;
  setAlertAction: (v: (() => void) | null) => void;
  setAlertSecondaryLabel: (v: string | null) => void;
  setAlertSecondaryAction: (v: (() => void) | null) => void;
  deleteTargetId: string | null;
  isClearConfirmOpen: boolean;
  performDelete: () => void;
  performClearAll: () => void;
  performClearSelectedAgent: () => void;
  setDeleteTargetId: (v: string | null) => void;
  setIsClearConfirmOpen: (v: boolean) => void;
  selectedAgentName: string | null;
  selectedAgentIcon: string | null;
  isChangePasswordOpen: boolean;
  setIsChangePasswordOpen: (v: boolean) => void;
  isChangingPassword: boolean;
  onChangePasswordSubmit: (oldPassword: string, newPassword: string, confirmPassword: string) => void;
  isImageConfigOpen: boolean;
  imageBedConfig: ImageBedConfig;
  onImageConfigSave: (cfg: ImageBedConfig) => void;
  setIsImageConfigOpen: (v: boolean) => void;
  isAdvancedSettingsOpen: boolean;
  imageProcessingSettings: ImageProcessingSettings;
  onImageProcessingSave: (cfg: ImageProcessingSettings) => void;
  setIsAdvancedSettingsOpen: (v: boolean) => void;
  isPngSettingsOpen: boolean;
  setIsPngSettingsOpen: (v: boolean) => void;
  isEditorOpen: boolean;
  editingLineupId: string | null;
  newLineupData: NewLineupForm;
  setNewLineupData: (fn: (prev: NewLineupForm) => NewLineupForm) => void;
  handleEditorSave: () => void;
  handleEditorClose: () => void;
  selectedSide: 'all' | 'attack' | 'defense';
  setSelectedSide: (val: 'all' | 'attack' | 'defense') => void;
  viewingLineup: BaseLineup | null;
  setViewingLineup: (v: BaseLineup | null) => void;
  setSelectedLineupId: (v: string | null) => void;
  handleEditStart: (lineup: BaseLineup) => void;
  setViewingImage: (v: LightboxImage | null) => void;
  getMapEnglishName: (name: string) => string;
  isGuest: boolean;
  viewingImage: LightboxImage | null;
  isChangelogOpen: boolean;
  setIsChangelogOpen: (v: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (v: boolean) => void;
  saveNewLineup: (payload: LineupDbPayload) => Promise<BaseLineup>;
  fetchLineups: (userId: string) => void;
  lineups: BaseLineup[];
  isBatchDownloadModalOpen: boolean;
  onBatchDownloadClose: () => void;
  handleBatchDownload: (scope: 'agent' | 'map') => Promise<void>;
  totalAgentLineups: number;
  totalMapLineups: number;
};

export function buildModalProps(params: Params): React.ComponentProps<typeof AppModals> {
  return {
    isAuthModalOpen: params.isAuthModalOpen,
    userId: params.userId,
    targetUserId: params.targetUserId,
    passwordInput: params.passwordInput,
    isAuthLoading: params.isAuthLoading,
    onAuthClose: () => {
      if (!params.userId) return;
      params.setIsAuthModalOpen(false);
      params.setPendingUserId('');
      params.setPasswordInput('');
    },
    onTargetUserChange: (val: string) => {
      params.setPendingUserId(val);
      params.setCustomUserIdInput(val);
    },
    onResetUserId: params.handleResetUserId,
    onPasswordChange: (val: string) => params.setPasswordInput(val),
    onGuestConfirm: () => params.handleConfirmUserAuth(''),
    onLoginConfirm: () => params.handleConfirmUserAuth(),
    isMapModalOpen: params.isMapModalOpen,
    maps: params.maps,
    selectedMap: params.selectedMap,
    selectedAgent: params.selectedAgent,
    selectedAbilityIndex: params.selectedAbilityIndex,
    setSelectedMap: params.setSelectedMap,
    setIsMapModalOpen: params.setIsMapModalOpen,
    getMapDisplayName: params.getMapDisplayName,
    isPreviewModalOpen: params.isPreviewModalOpen,
    previewInput: params.previewInput,
    setPreviewInput: params.setPreviewInput,
    onPreviewClose: () => params.setIsPreviewModalOpen(false),
    onPreviewSubmit: params.onPreviewSubmit,
    alertMessage: params.alertMessage,
    alertActionLabel: params.alertActionLabel,
    alertAction: params.alertAction,
    alertSecondaryLabel: params.alertSecondaryLabel,
    alertSecondaryAction: params.alertSecondaryAction,
    onAlertClose: () => {
      params.setAlertMessage(null);
      params.setAlertActionLabel(null);
      params.setAlertAction(null);
      params.setAlertSecondaryLabel(null);
      params.setAlertSecondaryAction(null);
    },
    setAlertMessage: params.setAlertMessage,
    deleteTargetId: params.deleteTargetId,
    isClearConfirmOpen: params.isClearConfirmOpen,
    selectedAgentName: params.selectedAgentName,
    selectedAgentIcon: params.selectedAgentIcon,
    onDeleteCancel: () => params.setDeleteTargetId(null),
    onDeleteConfirm: params.performDelete,
    onClearConfirm: params.performClearAll,
    onClearAgentConfirm: params.performClearSelectedAgent,
    onClearModalClose: () => {
      params.setIsClearConfirmOpen(false);
    },

    isChangePasswordOpen: params.isChangePasswordOpen,
    isChangingPassword: params.isChangingPassword,
    onChangePasswordSubmit: params.onChangePasswordSubmit,
    setIsChangePasswordOpen: params.setIsChangePasswordOpen,
    isImageConfigOpen: params.isImageConfigOpen,
    imageBedConfig: params.imageBedConfig,
    onImageConfigClose: () => params.setIsImageConfigOpen(false),
    onImageConfigSave: params.onImageConfigSave,
    isAdvancedSettingsOpen: params.isAdvancedSettingsOpen,
    imageProcessingSettings: params.imageProcessingSettings,
    onAdvancedSettingsClose: () => params.setIsAdvancedSettingsOpen(false),
    isPngSettingsOpen: params.isPngSettingsOpen,
    onPngSettingsClose: () => params.setIsPngSettingsOpen(false),
    onImageProcessingSave: params.onImageProcessingSave,
    isEditorOpen: params.isEditorOpen,
    editingLineupId: params.editingLineupId,
    newLineupData: params.newLineupData,
    setNewLineupData: params.setNewLineupData,
    handleEditorSave: params.handleEditorSave,
    onEditorClose: params.handleEditorClose,
    selectedSide: params.selectedSide,
    setSelectedSide: params.setSelectedSide,
    viewingLineup: params.viewingLineup,
    onViewerClose: () => {
      params.setViewingLineup(null);
      params.setSelectedLineupId(null);
    },
    handleEditStart: params.handleEditStart,
    setViewingImage: params.setViewingImage,
    getMapEnglishName: params.getMapEnglishName,
    isGuest: params.isGuest,

    viewingImage: params.viewingImage,
    isChangelogOpen: params.isChangelogOpen,
    onChangelogClose: () => params.setIsChangelogOpen(false),
    isImportModalOpen: params.isImportModalOpen,
    onImportClose: () => params.setIsImportModalOpen(false),
    onImportSuccess: params.saveNewLineup,
    fetchLineups: params.fetchLineups,
    lineups: params.lineups,
    isBatchDownloadModalOpen: params.isBatchDownloadModalOpen,
    onBatchDownloadClose: params.onBatchDownloadClose,
    handleBatchDownload: params.handleBatchDownload,
    totalAgentLineups: params.totalAgentLineups,
    totalMapLineups: params.totalMapLineups,
  };
}
