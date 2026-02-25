/**
 * useEscapeClose - Hook 层
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
 * - `useEscapeClose`
 *
 * 依赖关系：
 * - 上游依赖：`react`
 * - 下游影响：供组件与控制器复用
 */

import { useEffect, useRef } from 'react';

type EscapeHandler = () => void;

const escapeHandlers: EscapeHandler[] = [];
let hasListener = false;

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return;
  const handler = escapeHandlers[escapeHandlers.length - 1];
  if (!handler) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  handler();
};

const ensureListener = () => {
  if (hasListener || typeof document === 'undefined') return;
  document.addEventListener('keydown', onKeyDown);
  hasListener = true;
};

const releaseListener = () => {
  if (!hasListener || escapeHandlers.length > 0 || typeof document === 'undefined') return;
  document.removeEventListener('keydown', onKeyDown);
  hasListener = false;
};

export function useEscapeClose(isActive: boolean, onClose?: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isActive || !onCloseRef.current) return;

    ensureListener();

    const handler = () => {
      const current = onCloseRef.current;
      if (current) current();
    };

    escapeHandlers.push(handler);

    return () => {
      const index = escapeHandlers.lastIndexOf(handler);
      if (index !== -1) escapeHandlers.splice(index, 1);
      releaseListener();
    };
  }, [isActive]);
}
