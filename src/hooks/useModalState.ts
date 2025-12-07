import { useState } from 'react';

// 统一管理弹窗与提醒相关的状态
export function useModalState() {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewInput, setPreviewInput] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  return {
    isMapModalOpen,
    setIsMapModalOpen,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    previewInput,
    setPreviewInput,
    isEditorOpen,
    setIsEditorOpen,
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    deleteTargetId,
    setDeleteTargetId,
    alertMessage,
    setAlertMessage,
    viewingImage,
    setViewingImage,
    isChangelogOpen,
    setIsChangelogOpen,
  };
}
