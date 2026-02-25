/**
 * DeleteConfirmModal - 组件层
 *
 * 模块定位：
 * - 所在层级：组件层
 * - 主要目标：承载界面渲染与事件分发
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:DeleteConfirmModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`./AlertModal`
 * - 下游影响：供页面与应用壳组合
 */

// @ts-nocheck
import React from 'react';
import AlertModal from './AlertModal';

const DeleteConfirmModal = ({ deleteTargetId, onCancel, onConfirm }) => {
  if (!deleteTargetId) return null;

  return (
    <AlertModal
      variant="danger"
      title="确认删除点位"
      subtitle="安全操作"
      message="删除后不可恢复"
      onClose={onCancel}
      actionLabel="确认删除"
      onAction={onConfirm}
      secondaryLabel="取消"
      onSecondary={onCancel}
    />
  );
};

export default DeleteConfirmModal;
