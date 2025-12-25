/**
 * SharedApp - 共享库应用根组件
 * 
 * 职责：
 * - 协调共享库的整体路由与认证状态
 * - 处理密码重置 (Recovery Mode) 逻辑
 * - 提供全局弹窗容器 (Lightbox, AlertModal)
 */
import React, { useState, useEffect } from 'react';
import '../../styles/fonts.css';
import '../../index.css';
import 'leaflet/dist/leaflet.css';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import SharedLoginPage from './SharedLoginPage';
import SharedMainView from './SharedMainView';
import Lightbox from '../../components/Lightbox';
import AlertModal from '../../components/AlertModal';
import ResetPasswordModal from './ResetPasswordModal';
import { LightboxImage } from '../../types/ui';
import { supabase } from '../../supabaseClient';

function SharedApp() {
    const { user, isLoading, signOut } = useEmailAuth();
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<LightboxImage | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);

    // 监听密码重置事件
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // 用户通过重置链接登录，进入 recovery 模式
                setIsRecoveryMode(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // 处理重置密码完成或取消
    const handleRecoveryComplete = () => {
        setIsRecoveryMode(false);
    };

    const handleRecoveryCancel = async () => {
        // 如果用户取消重置密码，强制登出
        await signOut();
        setIsRecoveryMode(false);
        setAlertMessage('密码重置已取消，请重新登录');
    };

    // 认证加载中（短暂等待）
    if (isLoading) {
        return (
            <div className="flex h-screen w-screen bg-[#0f1923] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">加载中...</span>
                </div>
            </div>
        );
    }

    // 密码重置模式 - 必须完成重置才能继续
    if (isRecoveryMode && user) {
        return (
            <div className="flex h-screen w-screen bg-[#0f1923] items-center justify-center">
                <ResetPasswordModal
                    isOpen={true}
                    onClose={handleRecoveryComplete}
                    onCancel={handleRecoveryCancel}
                    setAlertMessage={setAlertMessage}
                />
                <AlertModal
                    message={alertMessage}
                    onClose={() => setAlertMessage(null)}
                />
            </div>
        );
    }

    // 显示登录弹窗
    if (showLoginModal && !user) {
        return (
            <>
                <SharedLoginPage
                    setAlertMessage={setAlertMessage}
                    onBack={() => setShowLoginModal(false)}
                />
                <AlertModal
                    message={alertMessage}
                    onClose={() => setAlertMessage(null)}
                />
            </>
        );
    }

    // 直接显示共享库主视图（无论是否登录）
    return (
        <>
            <SharedMainView
                user={user}
                onSignOut={signOut}
                setAlertMessage={setAlertMessage}
                setViewingImage={setViewingImage}
                onRequestLogin={() => setShowLoginModal(true)}
            />
            <Lightbox
                viewingImage={viewingImage}
                setViewingImage={setViewingImage}
            />
            <AlertModal
                message={alertMessage}
                onClose={() => setAlertMessage(null)}
            />
        </>
    );
}

export default SharedApp;
