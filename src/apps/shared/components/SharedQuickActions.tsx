/**
 * SharedQuickActions - 共享库快捷操作组件
 * 
 * 职责：
 * - 提供修改密码、查看个人信息的浮动菜单
 * - 管理菜单的展开/收起状态
 */
import React from 'react';
import Icon from '../../../components/Icon';
import { useEmailAuth } from '../../../hooks/useEmailAuth';

type Props = {
    isOpen: boolean;
    onToggle: () => void;
    onChangePassword: () => void;
    onUserProfile: () => void;
};

const SharedQuickActions: React.FC<Props> = ({
    isOpen,
    onToggle,
    onChangePassword,
    onUserProfile,
}) => {
    const { user } = useEmailAuth();

    // 未登录时不显示
    if (!user) return null;

    return (
        <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
            <div className="relative flex items-center gap-3 pointer-events-none">
                <div className="relative pointer-events-auto">
                    {isOpen && (
                        <div className="absolute bottom-14 right-0 bg-[#11161c] border border-white/15 rounded-2xl shadow-2xl p-3 w-44 space-y-2 backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="text-[11px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <Icon name="Settings" size={12} /> 快捷功能
                            </div>

                            <button
                                onClick={onUserProfile}
                                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[13px] text-white border border-white/10 transition-colors"
                            >
                                <span className="flex items-center gap-1.5"><Icon name="User" size={14} /> 个人信息</span>
                                <Icon name="ChevronRight" size={12} className="text-gray-400" />
                            </button>

                            <button
                                onClick={onChangePassword}
                                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[13px] text-white border border-white/10 transition-colors"
                            >
                                <span className="flex items-center gap-1.5"><Icon name="Key" size={14} /> 修改密码</span>
                                <Icon name="ChevronRight" size={12} className="text-gray-400" />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={onToggle}
                        className={`w-12 h-12 rounded-full bg-[#ff4655] hover:bg-[#d93a49] text-white flex items-center justify-center shadow-lg shadow-red-900/40 border border-white/10 transition-all duration-300 ${isOpen ? 'rotate-90' : 'hover:scale-105'
                            }`}
                        title="快捷功能"
                    >
                        <Icon name={isOpen ? 'X' : 'Menu'} size={22} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharedQuickActions;
