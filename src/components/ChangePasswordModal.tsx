import React, { useState, useEffect } from 'react';
import Icon from './Icon';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isChangingPassword: boolean;
  onChangePasswordSubmit: (oldPassword: string, newPassword: string, confirmPassword: string) => void;
};

const ChangePasswordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isChangingPassword,
  onChangePasswordSubmit,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onChangePasswordSubmit(oldPassword, newPassword, confirmPassword);
  };

  return (
    <div
      className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
              <Icon name="Key" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">修改密码</h3>
              <p className="text-xs text-gray-500 mt-0.5">定期更换密码以保障账户安全</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 bg-[#181b1f]">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="space-y-4"
            autoComplete="off"
          >
            {/* 隐藏的用户名输入框，引导浏览器自动填充逻辑，防止误填其他输入框 */}
            <input type="text" name="username" autoComplete="username" className="hidden" />
            {/* 隐藏的密码输入框，吸收浏览器的自动填充 */}
            <input type="password" className="hidden" autoComplete="new-password" />

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium ml-1">当前密码</label>
              <input
                type="password"
                name="current-password"
                autoComplete="new-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#ff4655] outline-none transition-colors placeholder:text-gray-600"
                placeholder="请输入您现在的密码"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium ml-1">新密码</label>
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#ff4655] outline-none transition-colors placeholder:text-gray-600"
                placeholder="设置一个新的强密码"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium ml-1">确认新密码</label>
              <input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#ff4655] outline-none transition-colors placeholder:text-gray-600"
                placeholder="请再次输入新密码"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-gray-200 hover:border-white/30 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-lg shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isChangingPassword && <Icon name="Loader2" className="animate-spin" size={16} />}
                确认修改
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
