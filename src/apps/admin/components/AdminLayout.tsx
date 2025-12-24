import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Icon, { IconName } from '../../../components/Icon';
import UserAvatar from '../../../components/UserAvatar';
import { AdminPage } from '../AdminApp';
import { supabase } from '../../../supabaseClient';
import UserProfileModal from '../../shared/components/UserProfileModal';

interface AdminLayoutProps {
    currentPage: AdminPage;
    onPageChange: (page: AdminPage) => void;
    children: React.ReactNode;
}

// 导航菜单配置
const NAV_ITEMS: { id: AdminPage; label: string; icon: IconName }[] = [
    { id: 'dashboard', label: '仪表盘', icon: 'LayoutDashboard' },
    { id: 'users', label: '用户管理', icon: 'Users' },
    { id: 'logs', label: '下载日志', icon: 'FileText' },
    { id: 'upload', label: '上传点位', icon: 'Upload' },
    { id: 'review', label: '审核投稿', icon: 'ClipboardCheck' },
    { id: 'shared', label: '共享库管理', icon: 'Share2' },
    { id: 'settings', label: '系统设置', icon: 'Settings' },
];

/**
 * 后台管理布局组件
 * 包含侧边导航栏和用户信息
 */
function AdminLayout({ currentPage, onPageChange, children }: AdminLayoutProps) {
    const [user, setUser] = useState<User | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // 获取用户信息
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // 退出登录
    const handleLogout = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        setIsLoggingOut(false);
        setShowUserMenu(false);
    };

    // 获取用户显示名称
    const getUserDisplayName = () => {
        if (!user) return '管理员';
        return user.user_metadata?.nickname || user.user_metadata?.display_name || user.email?.split('@')[0] || '管理员';
    };

    // 获取用户头像
    const getUserAvatar = () => {
        return user?.user_metadata?.avatar || '捷风.png';
    };

    // 打开个人信息编辑
    const handleEditProfile = () => {
        setShowUserMenu(false);
        setShowProfileModal(true);
    };

    return (
        <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
            {/* 侧边导航栏 */}
            <div className="w-64 flex-shrink-0 flex flex-col bg-[#1f2326] border-r border-white/10">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <img src="/brand-logo.svg" alt="VALPOINT" className="h-8" />
                    <span className="ml-2 text-xs text-gray-500 font-mono">ADMIN</span>
                </div>

                {/* 导航菜单 */}
                <nav className="flex-1 p-4 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${currentPage === item.id
                                ? 'bg-[#ff4655] text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon name={item.icon} size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* 底部链接 */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex flex-col gap-2 text-xs text-gray-500">
                        <a
                            href="/user.html"
                            className="hover:text-white transition-colors"
                        >
                            → 返回个人库
                        </a>
                        <a
                            href="/shared.html"
                            className="hover:text-white transition-colors"
                        >
                            → 查看共享库
                        </a>
                    </div>
                </div>
            </div>

            {/* 主内容区域 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 顶部栏 */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#1f2326]">
                    <h1 className="text-lg font-semibold">
                        {NAV_ITEMS.find((item) => item.id === currentPage)?.label || '后台管理'}
                    </h1>

                    {/* 用户信息区域 */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <div className="text-right">
                                <div className="text-sm font-medium text-white">{getUserDisplayName()}</div>
                                <div className="text-xs text-gray-500">{user?.email || '未登录'}</div>
                            </div>
                            <div className="w-9 h-9">
                                <UserAvatar email={user?.email || ''} size={36} borderColor="default" />
                            </div>
                            <Icon name="ChevronDown" size={16} className={`text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* 用户下拉菜单 */}
                        {showUserMenu && (
                            <>
                                {/* 背景遮罩 */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowUserMenu(false)}
                                />
                                {/* 菜单 */}
                                <div className="absolute right-0 top-full mt-2 w-64 bg-[#1f2326] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {/* 用户信息头部 */}
                                    <div className="p-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar email={user?.email || ''} size={56} borderColor="red" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white text-lg truncate">{getUserDisplayName()}</div>
                                                <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    注册于 {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 菜单项 */}
                                    <div className="p-2">

                                        {/* 编辑个人信息 */}
                                        <button
                                            onClick={handleEditProfile}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <Icon name="User" size={16} />
                                            编辑个人信息
                                        </button>

                                        {/* 退出登录 */}
                                        <button
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isLoggingOut ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                    退出中...
                                                </>
                                            ) : (
                                                <>
                                                    <Icon name="LogOut" size={16} />
                                                    退出登录
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* 页面内容 */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>

            {/* 个人信息弹窗 */}
            <UserProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                setAlertMessage={setAlertMessage}
            />

            {/* 提示消息 */}
            {alertMessage && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1500] px-6 py-3 bg-emerald-500/90 text-white rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4">
                    {alertMessage}
                </div>
            )}
        </div>
    );
}

export default AdminLayout;
