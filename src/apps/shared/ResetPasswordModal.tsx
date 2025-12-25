/**
 * ResetPasswordModal - 重置密码弹窗
 * 
 * 职责：
 * - 当用户点击邮件链接进入重置流程后，提供新密码输入界面
 * - 验证并提交新密码到 Supabase Auth 服务
 */
import React, { useState } from 'react';
import Icon from '../../components/Icon';
import { supabase } from '../../supabaseClient';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCancel?: () => void;
    setAlertMessage: (msg: string | null) => void;
}

/**
 * 重置密码弹窗
 * 当用户通过重置链接登录后显示
 */
function ResetPasswordModal({ isOpen, onClose, onCancel, setAlertMessage }: Props) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (password.length < 6) {
            setValidationError('密码至少需要6位');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('两次输入的密码不一致');
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.auth.updateUser({ password });
        setIsSubmitting(false);

        if (error) {
            setValidationError(error.message);
        } else {
            setAlertMessage('密码重置成功！');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 bg-[#1f2326] rounded-xl border border-white/10 p-8 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-2 text-center">设置新密码</h2>
                <p className="text-gray-400 text-sm mb-6 text-center">
                    请输入您的新密码
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">新密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setValidationError(null); }}
                            placeholder="至少6位"
                            className="w-full px-4 py-3 bg-[#0f1923] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50 focus:border-[#ff4655] transition-colors"
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">确认新密码</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setValidationError(null); }}
                            placeholder="再次输入新密码"
                            className="w-full px-4 py-3 bg-[#0f1923] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50 focus:border-[#ff4655] transition-colors"
                            disabled={isSubmitting}
                        />
                    </div>

                    {validationError && (
                        <p className="mb-4 text-sm text-red-400">{validationError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || !password || !confirmPassword}
                        className="w-full py-3 bg-[#ff4655] hover:bg-[#ff5a67] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                保存中...
                            </>
                        ) : (
                            <>
                                <Icon name="Check" size={18} />
                                确认修改
                            </>
                        )}
                    </button>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="w-full mt-3 py-2 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50"
                        >
                            取消并退出登录
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordModal;
