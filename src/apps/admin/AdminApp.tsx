/**
 * AdminApp - 后台管理系统根组件
 * 
 * 职责：
 * - 提供管理员登录检查与侧边栏导航控制
 * - 实现基于 React Router 的管理页面路由配置
 * - 提供全局弹窗管理器 (Global Modal Context/Host)
 */
import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import '../../styles/fonts.css';
import '../../index.css';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import DownloadLogsPage from './pages/DownloadLogsPage';
import LineupUploadPage from './pages/LineupUploadPage';
import SettingsPage from './pages/SettingsPage';
import LineupReviewPage from './pages/LineupReviewPage';
import SharedManagePage from './pages/SharedManagePage';
import SharedLoginPage from '../shared/SharedLoginPage';
import AdminAccessDenied from './components/AdminAccessDenied';
import { supabase } from '../../supabaseClient';
import { checkAdminAccess, checkAdminAccessByEmail, AdminAccessResult } from '../../lib/adminService';

export type AdminPage = 'dashboard' | 'users' | 'logs' | 'upload' | 'review' | 'shared' | 'settings';

/**
 * 后台管理应用根组件
 */
function AdminApp() {
    const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingAccess, setIsCheckingAccess] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [adminAccess, setAdminAccess] = useState<AdminAccessResult | null>(null);

    // 监听用户登录状态
    useEffect(() => {
        // 获取当前用户
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (!user) {
                setIsLoading(false);
            }
        });

        // 监听登录状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setAdminAccess(null);
                setIsCheckingAccess(false);
            } else {
                // 登录成功后设置检查中状态
                setIsCheckingAccess(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 检查管理员权限
    useEffect(() => {
        if (!user) {
            setAdminAccess(null);
            return;
        }

        const checkAccess = async () => {
            setIsCheckingAccess(true);
            // 首先通过 user_id 检查
            let access = await checkAdminAccess(user.id);

            // 如果通过 user_id 找不到，尝试通过邮箱查找（可能是首次登录）
            if (!access.isAdmin && user.email) {
                const emailAccess = await checkAdminAccessByEmail(user.email);
                if (emailAccess.isAdmin) {
                    // user_profiles.id 直接关联 auth.users.id，无需额外更新
                    access = emailAccess;
                }
            }

            setAdminAccess(access);
            setIsCheckingAccess(false);
            setIsLoading(false);
        };

        checkAccess();
    }, [user]);

    // 退出登录
    const handleLogout = async () => {
        await supabase.auth.signOut();
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
                return <SettingsPage isSuperAdmin={adminAccess?.isSuperAdmin ?? false} />;
            default:
                return <DashboardPage />;
        }
    };

    // 加载中或检查权限中
    if (isLoading || isCheckingAccess) {
        return (
            <div className="min-h-screen bg-[#0f1923] flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // 未登录，显示登录页面
    if (!user) {
        return <SharedLoginPage setAlertMessage={setAlertMessage} />;
    }

    // 已登录但无管理员权限，显示无权限页面
    if (!adminAccess?.isAdmin) {
        return <AdminAccessDenied email={user.email} onLogout={handleLogout} />;
    }

    // 已登录且有管理员权限，显示管理后台
    return (
        <AdminLayout currentPage={currentPage} onPageChange={setCurrentPage}>
            {renderPage()}
        </AdminLayout>
    );
}

export default AdminApp;
