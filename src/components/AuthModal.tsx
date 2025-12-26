/**
 * AuthModal - 应用入口身份验证模态框
 * 
 * 处理用户 ID 输入和身份验证模式选择：
 * - 随机 ID 生成
 * - 登录模式（输入密码）：支持完整编辑操作
 * - 游客模式（留空密码）：仅支持查看和分享
 */
import React, { useState } from 'react';
import Icon from './Icon';

type Props = {
  isOpen: boolean;
  userId: string | null;
  targetUserId: string;
  passwordInput: string;
  isAuthLoading: boolean;
  onClose: () => void;
  onTargetUserChange: (val: string) => void;
  onResetUserId: () => void;
  onPasswordChange: (val: string) => void;
  onGuestConfirm: () => void;
  onLoginConfirm: () => void;
};

const AuthModal: React.FC<Props> = ({
  isOpen,
  userId,
  targetUserId,
  passwordInput,
  isAuthLoading,
  onClose,
  onTargetUserChange,
  onResetUserId,
  onPasswordChange,
  onGuestConfirm,
  onLoginConfirm,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && userId && onClose()}
    >
      <div className="w-full max-w-lg bg-[#1f2326] border border-white/10 rounded-xl shadow-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">创建/登录 ID</div>
            <h3 className="text-xl font-bold text-white mt-1">选择进入模式</h3>
            <p className="text-sm text-gray-400 mt-1">输入密码进入登录模式；留空进入游客模式（可查看和分享）。</p>
          </div>
          <button
            type="button"
            disabled={!userId}
            onClick={() => {
              if (!userId) return;
              onClose();
            }}
            className={`p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-colors ${userId ? '' : 'opacity-40 cursor-not-allowed'
              }`}
            title={userId ? '关闭' : '请先完成模式选择'}
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>当前 ID</span>
            <button
              type="button"
              onClick={onResetUserId}
              className="px-2 py-1 rounded border border-white/10 text-[11px] text-blue-300 hover:text-white hover:border-white/40 transition-colors"
              title="生成新的随机 ID"
            >
              随机 ID
            </button>
          </div>
          <input
            type="text"
            value={targetUserId.toUpperCase()}
            onChange={(e) => onTargetUserChange((e.target.value || '').toUpperCase())}
            placeholder="请输入 8 位字母或数字"
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg font-mono text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
            maxLength={8}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">密码（留空则游客模式：仅查看与分享）</label>
          <div className="relative">
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              value={passwordInput}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="请输入密码，或留空以游客身份进入"
              className="w-full bg-black/30 border border-gray-700 rounded-lg py-3 pl-3 pr-10 text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((v) => !v)}
              className="absolute inset-y-0 right-2 px-2 text-gray-400 hover:text-white transition-colors"
              aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
            >
              <Icon name={isPasswordVisible ? 'EyeOff' : 'Eye'} size={16} />
            </button>
          </div>
        </div>
        <div className="text-[12px] text-gray-400 bg-black/20 border border-white/10 rounded-lg p-3 leading-relaxed">
          登录模式：可新增、编辑、删除、分享点位。<br />
          游客模式：可查看和分享该 ID 的点位数据，新增/编辑/删除入口隐藏。
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onGuestConfirm}
            disabled={isAuthLoading}
            className="px-4 py-2 rounded-lg border border-white/20 text-sm text-gray-200 hover:border-white/60 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            以游客模式进入
          </button>
          <button
            type="button"
            onClick={onLoginConfirm}
            disabled={isAuthLoading}
            className="px-4 py-2 rounded-lg bg-[#ff4655] hover:bg-[#d93a49] text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAuthLoading && <Icon name="Loader2" className="animate-spin" size={16} />}
            保存密码并登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
