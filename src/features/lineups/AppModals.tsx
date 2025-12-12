import React from 'react';
import MapPickerModal from '../../components/MapPickerModal';
import PreviewModal from '../../components/PreviewModal';
import AlertModal from '../../components/AlertModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import ClearLineupsModal from '../../components/ClearLineupsModal';
import SharedFilterModal from '../../components/SharedFilterModal';
import ImageBedConfigModal from '../../components/ImageBedConfigModal';
import ImageProcessingSettingsModal from '../../components/ImageProcessingSettingsModal';
import EditorModal from '../../components/EditorModal';
import ViewerModal from '../../components/ViewerModal';
import Lightbox from '../../components/Lightbox';
import AuthModal from '../../components/AuthModal';
import ChangelogModal from '../../components/ChangelogModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { BaseLineup, SharedLineup, MapOption, LineupSide, NewLineupForm } from '../../types/lineup';
import { ImageBedConfig } from '../../types/imageBed';
import { ImageProcessingSettings } from '../../types/imageProcessing';
import { LightboxImage } from '../../types/ui';

type Props = {
  // auth
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
  // map picker
  isMapModalOpen: boolean;
  maps: MapOption[];
  selectedMap: MapOption | null;
  setSelectedMap: (v: MapOption | null) => void;
  setIsMapModalOpen: (v: boolean) => void;
  getMapDisplayName: (name: string) => string;
  // preview
  isPreviewModalOpen: boolean;
  previewInput: string;
  setPreviewInput: (val: string) => void;
  onPreviewClose: () => void;
  onPreviewSubmit: () => void;
  // alerts
  alertMessage: string | null;
  alertActionLabel: string | null;
  alertAction: (() => void) | null;
  alertSecondaryLabel: string | null;
  alertSecondaryAction: (() => void) | null;
  onAlertClose: () => void;
  setAlertMessage: React.Dispatch<React.SetStateAction<string | null>>;
  // delete
  deleteTargetId: string | null;
  isClearConfirmOpen: boolean;
  selectedAgentName: string | null;
  selectedAgentIcon: string | null;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onClearConfirm: () => void;
  onClearAgentConfirm: () => void;
  onClearModalClose: () => void;
  isSharedFilterOpen: boolean;
  sharedContributors: string[];
  selectedSharedUserId: string | null;
  onSelectSharedUser: (userId: string | null) => void;
  onSharedFilterClose: () => void;
  isChangePasswordOpen: boolean;
  isChangingPassword: boolean;
  onChangePasswordSubmit: (oldPassword: string, newPassword: string, confirmPassword: string) => void;
  setIsChangePasswordOpen: (v: boolean) => void;
  // image bed
  isImageConfigOpen: boolean;
  imageBedConfig: ImageBedConfig;
  onImageConfigClose: () => void;
  onImageConfigSave: (cfg: ImageBedConfig) => void;
  isImageProcessingOpen: boolean;
  imageProcessingSettings: ImageProcessingSettings;
  onImageProcessingClose: () => void;
  onImageProcessingSave: (cfg: ImageProcessingSettings) => void;
  // editor/viewer
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
  libraryMode: 'personal' | 'shared';
  handleCopyShared: (lineup?: SharedLineup | null) => void;
  isSavingShared: boolean;
  // lightbox
  viewingImage: LightboxImage | null;
  // changelog
  isChangelogOpen: boolean;
  onChangelogClose: () => void;
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
  isSharedFilterOpen,
  sharedContributors,
  selectedSharedUserId,
  onSelectSharedUser,
  onSharedFilterClose,
  isChangePasswordOpen,
  isChangingPassword,
  onChangePasswordSubmit,
  setIsChangePasswordOpen,
  isImageConfigOpen,
  imageBedConfig,
  onImageConfigClose,
  onImageConfigSave,
  isImageProcessingOpen,
  imageProcessingSettings,
  onImageProcessingClose,
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
  libraryMode,
  handleCopyShared,
  isSavingShared,
  viewingImage,
  isChangelogOpen,
  onChangelogClose,
}) => {
  return (
    <>
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

      <SharedFilterModal
        isOpen={isSharedFilterOpen}
        contributors={sharedContributors}
        selectedUserId={selectedSharedUserId}
        onSelect={onSelectSharedUser}
        onClose={onSharedFilterClose}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        userId={userId}
        isSubmitting={isChangingPassword}
        onSubmit={onChangePasswordSubmit}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <ImageBedConfigModal isOpen={isImageConfigOpen} config={imageBedConfig} onClose={onImageConfigClose} onSave={onImageConfigSave} />
      <ImageProcessingSettingsModal isOpen={isImageProcessingOpen} settings={imageProcessingSettings} onClose={onImageProcessingClose} onSave={onImageProcessingSave} />

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
      />

      <ViewerModal
        viewingLineup={viewingLineup}
        onClose={onViewerClose}
        handleEditStart={handleEditStart}
        setViewingImage={setViewingImage}
        getMapDisplayName={getMapDisplayName}
        getMapEnglishName={getMapEnglishName}
        isGuest={isGuest}
        libraryMode={libraryMode}
        handleCopyShared={handleCopyShared}
        isSavingShared={isSavingShared}
      />

      <Lightbox viewingImage={viewingImage} setViewingImage={setViewingImage} />

      <ChangelogModal isOpen={isChangelogOpen} onClose={onChangelogClose} />
    </>
  );
};

export default AppModals;
