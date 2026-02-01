/**
 * AppModals - 点位应用Modals
 *
 * 职责：
 * - 渲染点位应用Modals相关的界面结构与样式。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

import React from 'react';
import MapPickerModal from '../../components/MapPickerModal';
import PreviewModal from '../../components/PreviewModal';
import AlertModal from '../../components/AlertModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import ClearLineupsModal from '../../components/ClearLineupsModal';

import ImageBedConfigModal from '../../components/ImageBedConfigModal';
import AdvancedSettingsDrawer from '../../components/AdvancedSettingsDrawer';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import ImageProcessingModal from '../../components/ImageProcessingModal';
import EditorModal from '../../components/EditorModal';
import ViewerModal from '../../components/ViewerModal';
import Lightbox from '../../components/Lightbox';
import AuthModal from '../../components/AuthModal';
import ChangelogModal from '../../components/ChangelogModal';
import ImportLineupModal from '../../components/ImportLineupModal';
import BatchDownloadModal from './components/BatchDownloadModal';
import { BaseLineup, SharedLineup, MapOption, LineupSide, NewLineupForm, LineupDbPayload, AgentOption } from '../../types/lineup';
import { ImageBedConfig } from '../../types/imageBed';
import { ImageProcessingSettings } from '../../types/imageProcessing';
import { LightboxImage } from '../../types/ui';

type Props = {
  isAuthModalOpen: boolean;
  userId: string | null;
  targetUserId: string;
  passwordInput: string;
  isAuthLoading: boolean;
  onAuthClose: () => void;
  onTargetUserChange: (val: string) => void;
  onResetUserId: () => void;
  onPasswordChange: (val: string) => void;
  onGuestConfirm: () => void;
  onLoginConfirm: () => void;
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
  setPreviewInput: (val: string) => void;
  onPreviewClose: () => void;
  onPreviewSubmit: () => void;
  alertMessage: string | null;
  alertActionLabel: string | null;
  alertAction: (() => void) | null;
  alertSecondaryLabel: string | null;
  alertSecondaryAction: (() => void) | null;
  onAlertClose: () => void;
  setAlertMessage: React.Dispatch<React.SetStateAction<string | null>>;
  deleteTargetId: string | null;
  isClearConfirmOpen: boolean;
  selectedAgentName: string | null;
  selectedAgentIcon: string | null;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onClearConfirm: () => void;
  onClearAgentConfirm: () => void;
  onClearModalClose: () => void;
  isChangePasswordOpen: boolean;
  isChangingPassword: boolean;
  onChangePasswordSubmit: (oldPassword: string, newPassword: string, confirmPassword: string) => void;
  setIsChangePasswordOpen: (v: boolean) => void;
  isImageConfigOpen: boolean;
  imageBedConfig: ImageBedConfig;
  onImageConfigClose: () => void;
  onImageConfigSave: (cfg: ImageBedConfig) => void;
  isAdvancedSettingsOpen: boolean;
  onAdvancedSettingsClose: () => void;
  isPngSettingsOpen: boolean;
  onPngSettingsClose: () => void;
  imageProcessingSettings: ImageProcessingSettings;
  onImageProcessingSave: (cfg: ImageProcessingSettings) => void;
  isEditorOpen: boolean;
  editingLineupId: string | null;
  newLineupData: NewLineupForm;
  setNewLineupData: (fn: (prev: NewLineupForm) => NewLineupForm) => void;
  handleEditorSave: () => void;
  onEditorClose: () => void;
  selectedSide: 'attack' | 'defense' | 'all';
  setSelectedSide: (val: LineupSide | 'all') => void;
  viewingLineup: BaseLineup | null;
  onViewerClose: () => void;
  handleEditStart: (lineup: BaseLineup) => void;
  setViewingImage: (val: LightboxImage | null) => void;
  getMapEnglishName: (name: string) => string;
  isGuest: boolean;
  viewingImage: LightboxImage | null;
  isChangelogOpen: boolean;
  onChangelogClose: () => void;
  isImportModalOpen: boolean;
  onImportClose: () => void;
  onImportSuccess: (payload: LineupDbPayload) => Promise<BaseLineup>;
  onOpenImageConfig: () => void;
  fetchLineups: (userId: string) => void;
  lineups: BaseLineup[];
  isBatchDownloadModalOpen: boolean;
  onBatchDownloadClose: () => void;
  handleBatchDownload: (scope: 'agent' | 'map') => Promise<void>;
  totalAgentLineups: number;
  totalMapLineups: number;
  onSubmitLineup?: (lineupId: string) => void;
  isAdmin?: boolean;
};

const AppModals: React.FC<Props> = ({
  isAuthModalOpen,
  userId,
  targetUserId,
  passwordInput,
  isAuthLoading,
  onAuthClose,
  onTargetUserChange,
  onResetUserId,
  onPasswordChange,
  onGuestConfirm,
  onLoginConfirm,
  isMapModalOpen,
  maps,
  selectedMap,
  selectedAgent,
  selectedAbilityIndex,
  setSelectedMap,
  setIsMapModalOpen,
  getMapDisplayName,
  isPreviewModalOpen,
  previewInput,
  setPreviewInput,
  onPreviewClose,
  onPreviewSubmit,
  alertMessage,
  alertActionLabel,
  alertAction,
  alertSecondaryLabel,
  alertSecondaryAction,
  onAlertClose,
  setAlertMessage,
  deleteTargetId,
  isClearConfirmOpen,
  selectedAgentName,
  selectedAgentIcon,
  onDeleteCancel,
  onDeleteConfirm,
  onClearConfirm,
  onClearAgentConfirm,
  onClearModalClose,
  isChangePasswordOpen,
  isChangingPassword,
  onChangePasswordSubmit,
  setIsChangePasswordOpen,
  isImageConfigOpen,
  imageBedConfig,
  onImageConfigClose,
  onImageConfigSave,
  isAdvancedSettingsOpen,
  onAdvancedSettingsClose,
  isPngSettingsOpen,
  onPngSettingsClose,
  imageProcessingSettings,
  onImageProcessingSave,
  isEditorOpen,
  editingLineupId,
  newLineupData,
  setNewLineupData,
  handleEditorSave,
  onEditorClose,
  selectedSide,
  setSelectedSide,
  viewingLineup,
  onViewerClose,
  handleEditStart,
  setViewingImage,
  getMapEnglishName,
  isGuest,
  viewingImage,
  isChangelogOpen,
  onChangelogClose,
  isImportModalOpen,
  onImportClose,
  onImportSuccess,
  onOpenImageConfig,
  fetchLineups,
  lineups,
  isBatchDownloadModalOpen,
  onBatchDownloadClose,
  handleBatchDownload,
  totalAgentLineups,
  totalMapLineups,
  onSubmitLineup,
  isAdmin,
}) => {
  return (
    <>
      <BatchDownloadModal
        isOpen={isBatchDownloadModalOpen}
        onClose={onBatchDownloadClose}
        currentMapName={selectedMap?.displayName ?? undefined}
        currentMapIcon={selectedMap?.displayIcon}
        currentAgentName={selectedAgentName ?? undefined}
        currentAgentIcon={selectedAgentIcon}
        totalAgentLineups={totalAgentLineups}
        totalMapLineups={totalMapLineups}
        onDownload={handleBatchDownload}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        userId={userId}
        targetUserId={targetUserId}
        passwordInput={passwordInput}
        isAuthLoading={isAuthLoading}
        onClose={onAuthClose}
        onTargetUserChange={onTargetUserChange}
        onResetUserId={onResetUserId}
        onPasswordChange={onPasswordChange}
        onGuestConfirm={onGuestConfirm}
        onLoginConfirm={onLoginConfirm}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        isChangingPassword={isChangingPassword}
        onChangePasswordSubmit={onChangePasswordSubmit}
      />

      <MapPickerModal
        isOpen={isMapModalOpen}
        maps={maps}
        selectedMap={selectedMap}
        setSelectedMap={setSelectedMap}
        setIsMapModalOpen={setIsMapModalOpen}
        getMapDisplayName={getMapDisplayName}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        previewInput={previewInput}
        setPreviewInput={setPreviewInput}
        onClose={onPreviewClose}
        onSubmit={onPreviewSubmit}
      />

      <AlertModal
        message={alertMessage}
        actionLabel={alertActionLabel}
        onAction={alertAction}
        secondaryLabel={alertSecondaryLabel}
        onSecondary={alertSecondaryAction}
        onClose={onAlertClose}
      />

      <DeleteConfirmModal deleteTargetId={deleteTargetId} onCancel={onDeleteCancel} onConfirm={onDeleteConfirm} />
      <ClearLineupsModal
        isOpen={isClearConfirmOpen}
        selectedAgentName={selectedAgentName}
        selectedAgentIcon={selectedAgentIcon}
        onClose={onClearModalClose}
        onClearAll={onClearConfirm}
        onClearSelectedAgent={onClearAgentConfirm}
      />

      <ImageBedConfigModal isOpen={isImageConfigOpen} config={imageBedConfig} onClose={onImageConfigClose} onSave={onImageConfigSave} />

      <AdvancedSettingsDrawer
        isOpen={isAdvancedSettingsOpen}
        settings={imageProcessingSettings}
        onClose={onAdvancedSettingsClose}
        onSave={onImageProcessingSave}
        userId={userId}
      />

      <ImageProcessingModal
        isOpen={isPngSettingsOpen}
        settings={imageProcessingSettings}
        onClose={onPngSettingsClose}
        onSave={onImageProcessingSave}
      />

      <EditorModal
        isEditorOpen={isEditorOpen}
        editingLineupId={editingLineupId}
        newLineupData={newLineupData}
        setNewLineupData={setNewLineupData}
        handleEditorSave={handleEditorSave}
        onClose={onEditorClose}
        selectedSide={selectedSide}
        setSelectedSide={setSelectedSide}
        imageBedConfig={imageBedConfig}
        setAlertMessage={setAlertMessage}
        imageProcessingSettings={imageProcessingSettings}
        selectedMap={selectedMap}
        selectedAgent={selectedAgent}
        selectedAbilityIndex={selectedAbilityIndex}
        getMapDisplayName={getMapDisplayName}
      />

      <ViewerModal
        viewingLineup={viewingLineup}
        onClose={onViewerClose}
        handleEditStart={handleEditStart}
        setViewingImage={setViewingImage}
        getMapDisplayName={getMapDisplayName}
        getMapEnglishName={getMapEnglishName}
        isGuest={isGuest}
        onSubmitLineup={onSubmitLineup}
        isAdmin={isAdmin}
      />

      <Lightbox viewingImage={viewingImage} setViewingImage={setViewingImage} />

      <ChangelogModal isOpen={isChangelogOpen} onClose={onChangelogClose} />

      <ImportLineupModal
        isOpen={isImportModalOpen}
        onClose={onImportClose}
        imageBedConfig={imageBedConfig}
        userId={userId}
        lineups={lineups}
        onImportSuccess={onImportSuccess}
        onOpenImageConfig={onOpenImageConfig}
        setAlertMessage={(msg) => setAlertMessage(msg)}
        fetchLineups={fetchLineups}
      />
    </>
  );
};

export default AppModals;
