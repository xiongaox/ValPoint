/**
 * SharedQuickActions - 共享库快捷操作
 *
 * 职责：
 * - 渲染共享库快捷操作相关的界面结构与样式。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

import React from 'react';
import Icon, { IconName } from '../../../components/Icon';
import { useEmailAuth } from '../../../hooks/useEmailAuth';

type Props = {
    isOpen: boolean;
    onToggle: () => void;
    onChangePassword: () => void;
    onUserProfile: () => void;
    saveProgress?: number;
    mode?: 'default' | 'pad';
};

const ActionButton = ({
    onClick,
    icon,
    title,
    color = "bg-[#2a2f38]",
    isPadMode = false,
}: {
    onClick: () => void,
    icon: IconName,
    title: string,
    color?: string,
    isPadMode?: boolean,
}) => (
    <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="px-2 py-1 bg-[#11161c] border border-white/10 rounded-md text-xs text-gray-300 shadow-lg whitespace-nowrap">
            {title}
        </div>
        <button
            onClick={onClick}
            className={`${isPadMode ? 'w-14 h-14' : 'w-12 h-12'} rounded-full ${color} hover:brightness-110 text-white flex items-center justify-center shadow-lg border border-white/10 transition-all active:scale-95`}
            title={title}
        >
            <Icon name={icon} size={isPadMode ? 24 : 20} />
        </button>
    </div>
);

const SharedQuickActions: React.FC<Props> = ({
    isOpen,
    onToggle,
    onChangePassword,
    onUserProfile,
    saveProgress,
    mode = 'default',
}) => {
    const { user } = useEmailAuth();
    const isPadMode = mode === 'pad';

    if (!user) return null;

    return (
        <div className={`absolute bottom-4 ${isPadMode ? 'right-2' : 'right-4'} z-30 pointer-events-none`}>
            <div className="relative flex items-end flex-col gap-3 pointer-events-none">
                <div className="pointer-events-auto flex flex-col items-end gap-3 button-list">
                    {isOpen && (
                        <>
                            <ActionButton onClick={onUserProfile} icon="User" title="个人信息" isPadMode={isPadMode} />
                            <ActionButton onClick={onChangePassword} icon="Key" title="修改密码" isPadMode={isPadMode} />
                        </>
                    )}

                    <div className="flex items-center gap-3">
                        {typeof saveProgress === 'number' && saveProgress > 0 && saveProgress < 100 && (
                            <div className={`${isPadMode ? 'w-14 h-14' : 'w-12 h-12'} relative flex items-center justify-center animate-in fade-in zoom-in duration-300`}>
                                {/* 背景环 */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx={isPadMode ? 28 : 24}
                                        cy={isPadMode ? 28 : 24}
                                        r={isPadMode ? 23 : 20}
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="transparent"
                                        className="text-gray-700"
                                    />
                                    {/* 进度环 */}
                                    <circle
                                        cx={isPadMode ? 28 : 24}
                                        cy={isPadMode ? 28 : 24}
                                        r={isPadMode ? 23 : 20}
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="transparent"
                                        strokeDasharray={isPadMode ? 144.5 : 125.6}
                                        strokeDashoffset={(isPadMode ? 144.5 : 125.6) - ((isPadMode ? 144.5 : 125.6) * saveProgress) / 100}
                                        className="text-[#ff4655] transition-all duration-300 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                {/* 中间文字 */}
                                <span className={`absolute ${isPadMode ? 'text-[11px]' : 'text-[10px]'} font-bold text-white`}>{saveProgress}%</span>
                            </div>
                        )}

                        <button
                            onClick={onToggle}
                            className={`${isPadMode ? 'w-14 h-14' : 'w-12 h-12'} rounded-full text-white flex items-center justify-center shadow-lg border border-white/10 transition-all duration-300 z-40 ${isOpen ? 'bg-[#2a2f38] rotate-90' : 'bg-[#ff4655] hover:bg-[#d93a49] shadow-red-900/40'
                                }`}
                            title="快捷功能"
                        >
                            <Icon name={isOpen ? 'X' : 'Menu'} size={isPadMode ? 26 : 22} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharedQuickActions;
