/**
 * AlertModal - 组件层
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
 * - `default:AlertModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`./Icon`、`lucide-react`、`../hooks/useEscapeClose`
 * - 下游影响：供页面与应用壳组合
 */

import React from 'react';
import Icon from './Icon';
import { AlertTriangle, Info } from 'lucide-react';
import { useEscapeClose } from '../hooks/useEscapeClose';

type AlertModalProps = {
  message: string | null;
  onClose?: () => void;
  actionLabel?: string | null;
  onAction?: (() => void) | null;
  secondaryLabel?: string | null;
  onSecondary?: (() => void) | null;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'danger';
};

const AlertModal: React.FC<AlertModalProps> = ({
  message,
  onClose,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  title,
  subtitle,
  variant = 'default'
}) => {
  const isOpen = Boolean(message);
  useEscapeClose(isOpen, onClose);

  if (!isOpen) return null;

  const handlePrimary = () => {
    if (onAction) {
      onAction();
    }
    onClose?.();
  };

  const handleSecondary = () => {
    if (onSecondary) {
      onSecondary();
    } else {
      onClose?.();
    }
  };

  const isDanger = variant === 'danger';
  const defaultTitle = isDanger ? '确认删除' : '提示';
  const defaultSubtitle = isDanger ? '安全操作' : '系统消息';

  return (
    <div className="fixed inset-0 z-[2200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isDanger
              ? 'bg-red-500/15 border-red-500/35 text-red-500'
              : 'bg-[#ff4655]/15 border-[#ff4655]/35 text-[#ff4655]'
              }`}>
              {isDanger ? <AlertTriangle size={22} /> : <Icon name="Info" size={22} />}
            </div>
            <div className="flex flex-col leading-tight">
              <h3 className="text-xl font-bold text-white">{title || defaultTitle}</h3>
              <span className="text-[11px] uppercase tracking-[0.15em] text-gray-500">{subtitle || defaultSubtitle}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            aria-label="关闭"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 bg-[#181b1f]">
          <div className={`rounded-xl border p-4 flex items-start gap-4 ${isDanger
            ? 'bg-[#ff4655]/10 border-[#ff4655]/20'
            : 'bg-white/5 border-white/10'
            }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-[#ff4655]/10' : 'bg-white/10'
              }`}>
              {isDanger ? <Info className="w-5 h-5 text-[#ff4655]" /> : <Icon name="Info" size={20} className="text-gray-400" />}
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-sm ${isDanger ? 'text-[#ff4655]' : 'text-gray-200'}`}>
                {isDanger ? '此操作无法恢复' : '详细说明'}
              </span>
              <span className={`text-xs mt-1 whitespace-pre-line ${isDanger ? 'text-[#ff4655]/80' : 'text-gray-400'}`}>
                {message}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSecondary}
              className="px-6 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-gray-300 hover:border-white/30 hover:text-white transition-colors"
            >
              {secondaryLabel || '关闭'}
            </button>
            {actionLabel && (
              <button
                onClick={handlePrimary}
                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all ${isDanger
                  ? 'bg-[#ff4655] hover:bg-[#ff4655]/90 shadow-red-500/20'
                  : 'bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-red-900/30'
                  }`}
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
