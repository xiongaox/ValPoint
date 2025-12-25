/**
 * ChangePasswordModal - 修改密码模态框
 * 
 * 提供修改当前用户密码的功能。
 * 需要用户提供原密码、新密码，并进行确认。
 */
import React, { useState } from 'react';
import Icon from './Icon';

type Props = {
  isOpen: boolean;
  userId: string | null;
  isSubmitting: boolean;
  onSubmit: (oldPassword: string, newPassword: string, confirmPassword: string) => void;
  onClose: () => void;
};

const ChangePasswordModal: React.FC<Props> = ({ isOpen, userId, isSubmitting, onSubmit, onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(oldPassword, newPassword, confirmPassword);
  };

  return (
    <div className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
              <Icon name="Key" size={18} />
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold text-white">修改密码</div>
              <div className="text-xs text-gray-500">当前 ID：{userId ?? '未登录'}（需校验原密码）</div>
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

        {/* Body */}
        <div className="p-5 space-y-4 bg-[#181b1f]">
          <div className="space-y-2">
            <label className="text-xs text-gray-400">原密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#ff4655] outline-none transition-colors"
              placeholder="请输入当前密码"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#ff4655] outline-none transition-colors"
              placeholder="请输入新密码"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#ff4655] outline-none transition-colors"
              placeholder="请再次输入新密码"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors"
              disabled={isSubmitting}
            >
              重置
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-red-900/30"
            >
              {isSubmitting && <Icon name="Loader2" size={16} className="animate-spin" />}
              保存密码
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
