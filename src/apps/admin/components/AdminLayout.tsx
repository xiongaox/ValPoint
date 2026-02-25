/**
 * AdminLayout - 应用壳层(admin)
 *
 * 模块定位：
 * - 所在层级：应用壳层(admin)
 * - 主要目标：承载管理后台流程与页面路由
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:AdminLayout`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../../components/Icon`、`../AdminApp`、`../../../components/UserAvatar`
 * - 下游影响：供 admin.html 入口挂载
 */

import React, { useState } from 'react';
import Icon, { IconName } from '../../../components/Icon';
import { AdminPage, AdminInfo } from '../AdminApp';
import UserAvatar from '../../../components/UserAvatar';
import AdminProfileModal from './AdminProfileModal';

interface AdminLayoutProps {
    currentPage: AdminPage;
    onPageChange: (page: AdminPage) => void;
    onLogout?: () => void;
    adminInfo: AdminInfo;
    setAlertMessage?: (msg: string | null) => void;
    children: React.ReactNode;
}

const NAV_ITEMS: { id: AdminPage; label: string; icon: IconName }[] = [
    { id: 'dashboard', label: '仪表盘', icon: 'LayoutDashboard' },
    { id: 'users', label: '用户管理', icon: 'Users' },
    { id: 'logs', label: '下载日志', icon: 'FileText' },
    { id: 'upload', label: '上传点位', icon: 'Upload' },
    { id: 'review', label: '审核投稿', icon: 'ClipboardCheck' },
    { id: 'shared', label: '点位管理', icon: 'Share2' },
    { id: 'settings', label: '系统设置', icon: 'Settings' },
];

function AdminLayout({ currentPage, onPageChange, onLogout, adminInfo, setAlertMessage, children }: AdminLayoutProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const handleAlertMessage = setAlertMessage || (() => { });

    const handleLogout = async () => {
        setIsLoggingOut(true);
        if (adminInfo.userId) {
            const { adminSupabase } = await import('../../../supabaseClient');
            await adminSupabase.auth.signOut();
        }
        onLogout?.();
        setIsLoggingOut(false);
        setShowUserMenu(false);
    };

    const roleLabel = adminInfo.isSuperAdmin ? '超级管理员' : '管理员';

    return (
        <>
            <div className="flex h-screen w-screen bg-[#0f1923] text-white overflow-hidden">
                <div className="w-64 flex-shrink-0 flex flex-col bg-[#1f2326] border-r border-white/10">
                    <div className="h-16 flex items-center px-6 border-b border-white/5">
                        <img src="/brand-logo.svg" alt="VALPOINT" className="h-8" />
                        <span className="ml-2 text-xs text-gray-500 font-mono">ADMIN</span>
                    </div>

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

                    <div className="p-4 border-t border-white/5 space-y-2">
                        <a
                            href="/user.html"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-all group"
                        >
                            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center group-hover:bg-[#ff4655]/20 group-hover:text-[#ff4655] transition-colors">
                                <Icon name="User" size={14} />
                            </div>
                            <span className="font-medium">返回个人库</span>
                            <Icon name="ArrowUpRight" size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
                        </a>
                        <a
                            href="/"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-all group"
                        >
                            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                <Icon name="Globe" size={14} />
                            </div>
                            <span className="font-medium">查看共享库</span>
                            <Icon name="ArrowUpRight" size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
                        </a>
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#1f2326]">
                        <h1 className="text-lg font-semibold">
                            {NAV_ITEMS.find((item) => item.id === currentPage)?.label || '后台管理'}
                        </h1>

                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <div className="text-right">
                                    <div className="text-sm font-medium text-white">{roleLabel}</div>
                                    <div className="text-xs text-gray-500">{adminInfo.nickname || adminInfo.account}</div>
                                </div>
                                <div className="rounded-xl overflow-hidden border-2 border-[#ff4655]/50 flex-shrink-0">
                                    <UserAvatar
                                        email={adminInfo.account === 'admin' ? '' : adminInfo.account}
                                        size={36}
                                        bordered={false}
                                    />
                                </div>
                                <Icon name="ChevronDown" size={16} className={`text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#1f2326] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl overflow-hidden flex-shrink-0">
                                                    <UserAvatar
                                                        email={adminInfo.account === 'admin' ? '' : adminInfo.account}
                                                        size={40}
                                                        bordered={false}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{adminInfo.nickname || '未设置昵称'}</div>
                                                    <div className="text-xs text-gray-500">{adminInfo.account}</div>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded ${adminInfo.isSuperAdmin
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {roleLabel}
                                                </span>
                                                {adminInfo.userId && (
                                                    <span className="text-xs text-gray-600">Supabase 用户</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-2 space-y-1">
                                            {adminInfo.userId && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setShowUserMenu(false);
                                                            setShowProfileModal(true);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                                                    >
                                                        <Icon name="User" size={16} />
                                                        个人资料
                                                    </button>
                                                    <div className="border-t border-white/10 my-1" />
                                                </>
                                            )}

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

                    <main className="flex-1 overflow-auto p-6">
                        {children}
                    </main>
                </div>
            </div>

            {adminInfo.userId && (
                <AdminProfileModal
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    adminEmail={adminInfo.account}
                    setAlertMessage={handleAlertMessage}
                />
            )}
        </>);
}

export default AdminLayout;

