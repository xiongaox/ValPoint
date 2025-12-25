/**
 * AlertModal - 通用提示/警告模态框
 * 
 * 用于展示错误信息、操作反馈或需要用户注意的简短提示。
 * 支持主操作按钮和次要操作按钮（默认为“关闭”）。
 */
import React from 'react';
import Icon from './Icon';

type AlertModalProps = {
  message: string | null;
  onClose?: () => void;
  actionLabel?: string | null;
  onAction?: (() => void) | null;
  secondaryLabel?: string | null;
  onSecondary?: (() => void) | null;
};

const AlertModal: React.FC<AlertModalProps> = ({ message, onClose, actionLabel, onAction, secondaryLabel, onSecondary }) => {
  if (!message) return null;
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
  return (
    <div className="fixed inset-0 z-[2200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="modal-content bg-[#1f2326] border-l-4 border-[#ff4655] p-6 rounded shadow-2xl max-w-sm w-full">
        <div className="flex items-start gap-4">
          <div className="text-[#ff4655] mt-1">
            <Icon name="Info" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">提示</h3>
            <p className="text-gray-300 text-sm whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {actionLabel && (
            <button
              onClick={handlePrimary}
              className="px-6 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
            >
              {actionLabel}
            </button>
          )}
          <button
            onClick={handleSecondary}
            className="px-5 py-2 rounded bg-[#ff4655] hover:bg-[#d93a49] text-white text-sm font-bold transition-colors"
          >
            {secondaryLabel || '关闭'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
