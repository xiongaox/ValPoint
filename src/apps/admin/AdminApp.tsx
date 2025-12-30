/**
 * AdminApp - 后台管理系统根组件
 * 
 * 职责：
 * - 提供管理员登录检查与侧边栏导航控制
 * - 实现基于环境变量的超级管理员认证
 * - 使用 Supabase anon key 读取数据（无需真实登录态）
 */
import React, { useState } from 'react';
import '../../styles/fonts.css';
import '../../index.css';
import { adminSupabase } from '../../supabaseClient';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import DownloadLogsPage from './pages/DownloadLogsPage';
import LineupUploadPage from './pages/LineupUploadPage';
import SettingsPage from './pages/SettingsPage';
import LineupReviewPage from './pages/LineupReviewPage';
import SharedManagePage from './pages/SharedManagePage';
import AdminLoginPage from './pages/AdminLoginPage';

export type AdminPage = 'dashboard' | 'users' | 'logs' | 'upload' | 'review' | 'shared' | 'settings';

/** 管理员信息 */
export interface AdminInfo {
    account: string;
    isSuperAdmin: boolean;
    userId?: string;
    nickname?: string;
    avatar?: string;
    role?: 'user' | 'admin' | 'super_admin';
}

/**
 * 后台管理应用根组件
 */
function AdminApp() {
    const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
    const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(() => {
        try {
            const stored = localStorage.getItem('valpoint_admin_info');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // 检查会话有效性 (仅针对 Supabase 用户)
    React.useEffect(() => {
        const checkSession = async () => {
            if (adminInfo?.userId) {
                const { data: { session } } = await adminSupabase.auth.getSession();
                if (!session) {
                    // 会话已过期
                    handleLogout();
                }
            }
        };
        checkSession();
    }, []);

    // 登录成功回调
    const handleLogin = (info: AdminInfo) => {
        setAdminInfo(info);
        localStorage.setItem('valpoint_admin_info', JSON.stringify(info));
    };

    // 退出登录
    const handleLogout = () => {
        setAdminInfo(null);
        localStorage.removeItem('valpoint_admin_info');
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage />;
            case 'users':
                return <UsersPage />;
            case 'logs':
                return <DownloadLogsPage />;
            case 'upload':
                return <LineupUploadPage setAlertMessage={setAlertMessage} />;
            case 'review':
                return <LineupReviewPage />;
            case 'shared':
                return <SharedManagePage />;
            case 'settings':
                return <SettingsPage isSuperAdmin={adminInfo?.isSuperAdmin ?? false} />;
            default:
                return <DashboardPage />;
        }
    };

    // 未登录，显示登录页面
    if (!adminInfo) {
        return <AdminLoginPage onLogin={handleLogin} setAlertMessage={setAlertMessage} />;
    }

    // 已登录，显示管理后台
    return (
        <AdminLayout
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onLogout={handleLogout}
            adminInfo={adminInfo}
        >
            {renderPage()}
        </AdminLayout>
    );
}

export default AdminApp;
