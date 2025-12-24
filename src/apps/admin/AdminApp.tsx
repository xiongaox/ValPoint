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
import { supabase } from '../../supabaseClient';

export type AdminPage = 'dashboard' | 'users' | 'logs' | 'upload' | 'review' | 'shared' | 'settings';

/**
 * 后台管理应用根组件
 */
function AdminApp() {
    const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // 监听用户登录状态
    useEffect(() => {
        // 获取当前用户
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setIsLoading(false);
        });

        // 监听登录状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage />;
            case 'users':
                return <UsersPage />;
            case 'logs':
                return <DownloadLogsPage />;
            case 'upload':
                return <LineupUploadPage />;
            case 'review':
                return <LineupReviewPage />;
            case 'shared':
                return <SharedManagePage />;
            case 'settings':
                return <SettingsPage />;
            default:
                return <DashboardPage />;
        }
    };

    // 加载中
    if (isLoading) {
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

    // 已登录，显示管理后台
    return (
        <AdminLayout currentPage={currentPage} onPageChange={setCurrentPage}>
            {renderPage()}
        </AdminLayout>
    );
}

export default AdminApp;
