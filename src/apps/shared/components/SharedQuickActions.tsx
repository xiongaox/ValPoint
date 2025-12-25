import React from 'react';
import Icon, { IconName } from '../../../components/Icon';
import { useEmailAuth } from '../../../hooks/useEmailAuth';

type Props = {
    isOpen: boolean;
    onToggle: () => void;
    onChangePassword: () => void;
    onUserProfile: () => void;
};

const ActionButton = ({ onClick, icon, title, color = "bg-[#2a2f38]" }: { onClick: () => void, icon: IconName, title: string, color?: string }) => (
    <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="px-2 py-1 bg-[#11161c] border border-white/10 rounded-md text-xs text-gray-300 shadow-lg whitespace-nowrap">
            {title}
        </div>
        <button
            onClick={onClick}
            className={`w-12 h-12 rounded-full ${color} hover:brightness-110 text-white flex items-center justify-center shadow-lg border border-white/10 transition-all active:scale-95`}
            title={title}
        >
            <Icon name={icon} size={20} />
        </button>
    </div>
);

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
            <div className="relative flex items-end flex-col gap-3 pointer-events-none">
                <div className="pointer-events-auto flex flex-col items-end gap-3 button-list">
                    {isOpen && (
                        <>
                            <ActionButton onClick={onUserProfile} icon="User" title="个人信息" />
                            <ActionButton onClick={onChangePassword} icon="Key" title="修改密码" />
                        </>
                    )}

                    <button
                        onClick={onToggle}
                        className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg border border-white/10 transition-all duration-300 z-40 ${isOpen ? 'bg-[#2a2f38] rotate-90' : 'bg-[#ff4655] hover:bg-[#d93a49] shadow-red-900/40'
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
