/**
 * useModalState - Hook 层
 *
 * 模块定位：
 * - 所在层级：Hook 层
 * - 主要目标：封装状态、副作用与交互流程
 *
 * 关键职责：
 * - 封装状态管理与副作用控制
 * - 对外暴露清晰的交互动作与派生状态
 * - 隔离组件层与数据层耦合
 *
 * 主要导出：
 * - `useModalState`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../types/ui`
 * - 下游影响：供组件与控制器复用
 */

import { useState, useCallback } from 'react';
import { LightboxImage } from '../types/ui';

export function useModalState() {
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewInput, setPreviewInput] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertActionLabel, setAlertActionLabel] = useState<string | null>(null);
  const [alertAction, setAlertAction] = useState<(() => void) | null>(null);
  const [alertSecondaryLabel, setAlertSecondaryLabel] = useState<string | null>(null);
  const [alertSecondaryAction, setAlertSecondaryAction] = useState<(() => void) | null>(null);
  const [viewingImage, setViewingImage] = useState<LightboxImage | null>(null);
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isSharedFilterOpen, setIsSharedFilterOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isBatchDownloadModalOpen, setIsBatchDownloadModalOpen] = useState<boolean>(false);

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
    alertActionLabel,
    setAlertActionLabel,
    alertAction,
    setAlertAction,
    alertSecondaryLabel,
    setAlertSecondaryLabel,
    alertSecondaryAction,
    setAlertSecondaryAction,
    viewingImage,
    setViewingImage,
    isChangelogOpen,
    setIsChangelogOpen,
    isSharedFilterOpen,
    setIsSharedFilterOpen,
    isChangePasswordOpen,
    setIsChangePasswordOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isBatchDownloadModalOpen,
    setIsBatchDownloadModalOpen,
  };
}
