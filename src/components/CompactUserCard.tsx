import React from 'react';
import { User } from '@supabase/supabase-js';
import UserAvatar from './UserAvatar';
import Icon from './Icon';
import { useUserProfile } from '../hooks/useUserProfile';

interface CompactUserCardProps {
    user: User | null;
    onSignOut: () => void;
    onRequestLogin: () => void;
    className?: string;
}

/**
 * 紧凑型用户卡片组件
 * 用于在顶部导航栏等位置显示当前用户信息
 */
const CompactUserCard: React.FC<CompactUserCardProps> = ({
    user,
    onSignOut,
    onRequestLogin,
    className = ''
}) => {
    // 从 user_profiles 表获取用户业务数据
    const { profile, isLoading: isProfileLoading } = useUserProfile();

    // 获取显示名称，在加载中时返回 null
    const displayName = isProfileLoading
        ? null
        : (profile?.nickname || profile?.custom_id || user?.email?.split('@')[0].toUpperCase() || 'AGENT');

    return (
        <div className={`group relative ${className}`}>
            {/* 容器高度设为 54px */}
            <div className="relative h-[54px] flex items-center gap-3 bg-gradient-to-r from-[#ff4655]/20 via-[#1f2326]/90 to-[#1f2326] backdrop-blur-md px-3 rounded-[12px] border border-white/10 min-w-[200px] overflow-hidden">
                {/* 装饰纹理 */}
                <div className="absolute top-0 right-0 w-16 h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#ffffff05_2px,#ffffff05_4px)] opacity-50 pointer-events-none" />

                {user ? (
                    <>
                        {/* 头像 (Compact) */}
                        <div className="relative shrink-0">
                            <div className="rounded-lg overflow-hidden border border-white/20 shadow-inner group-hover:border-[#ff4655]/50 transition-colors duration-300">
                                <UserAvatar email={user.email || ''} size={36} bordered={false} />
                            </div>
                            {/* 在线指示灯 */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#0f1923] rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            </div>
                        </div>

                        {/* 信息区域 (Compact) */}
                        <div className="flex flex-col flex-1 min-w-0 z-10 justify-center h-full py-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-[#ff4655] tracking-widest uppercase opacity-80 leading-none">AGENT</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#ff4655]/50 to-transparent" />
                            </div>
                            {displayName ? (
                                <span className="text-base text-white font-bold truncate tracking-wide font-mono leading-tight">
                                    {displayName}
                                </span>
                            ) : (
                                <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
                            )}
                        </div>

                        {/* 退出按钮 (Compact) */}
                        <div className="border-l border-white/10 pl-2 ml-1 h-6 flex items-center">
                            <button
                                onClick={onSignOut}
                                className="p-1.5 text-gray-500 hover:text-[#ff4655] hover:bg-white/5 rounded-md transition-all duration-200"
                                title="退出登录"
                            >
                                <Icon name="LogOut" size={16} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-9 h-9 bg-[#ff4655]/10 rounded-lg flex items-center justify-center border border-[#ff4655]/20">
                            <Icon name="User" size={16} className="text-[#ff4655]/80" />
                        </div>
                        <div className="flex flex-col flex-1 z-10 leading-tight pl-1">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">访客</span>
                            <span className="text-sm text-white font-bold tracking-wide">未登录用户</span>
                        </div>
                        <button
                            onClick={onRequestLogin}
                            className="h-7 px-3 bg-[#ff4655] hover:bg-[#ff5a67] text-white text-[12px] font-bold tracking-wider rounded-md transition-all shadow-lg flex items-center justify-center pb-0.5"
                        >
                            登录
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CompactUserCard;
