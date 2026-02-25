/**
 * ResetPasswordModal - 应用壳层(shared)
 *
 * 模块定位：
 * - 所在层级：应用壳层(shared)
 * - 主要目标：承载共享库业务流程与 UI 组合
 *
 * 关键职责：
 * - 承载应用入口装配与页面级流程
 * - 协调共享模块与业务模块的组合
 * - 保证不同 MPA 入口行为一致且可维护
 *
 * 主要导出：
 * - `default:ResetPasswordModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../components/Icon`、`../../supabaseClient`、`../../hooks/useEscapeClose`
 * - 下游影响：供 index.html 入口挂载
 */

import React, { useState } from 'react';
import Icon from '../../components/Icon';
import { supabase } from '../../supabaseClient';
import { useEscapeClose } from '../../hooks/useEscapeClose';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCancel?: () => void;
    setAlertMessage: (msg: string | null) => void;
}

function ResetPasswordModal({ isOpen, onClose, onCancel, setAlertMessage }: Props) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const handleClose = () => {
        if (isSubmitting) return;
        (onCancel || onClose)();
    };

    useEscapeClose(isOpen, handleClose);

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
        <div className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
                            <Icon name="Lock" size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xl font-bold text-white">设置新密码</div>
                            <div className="text-xs text-gray-500">请输入您的新密码</div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                        aria-label="关闭"
                    >
                        <Icon name="X" size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#181b1f]">
                    <div>
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

                    <div>
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
                        <p className="text-sm text-red-400">{validationError}</p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="text-xs text-gray-500">密码设置后立即生效</div>
                        <div className="flex items-center gap-2">
                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors disabled:opacity-50"
                                >
                                    取消
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting || !password || !confirmPassword}
                                className="px-5 py-2 rounded-lg bg-[#ff4655] hover:bg-[#ff5a67] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-[#ff4655]/30"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Check" size={16} />
                                        确认修改
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordModal;
