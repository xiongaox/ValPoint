/**
 * SharedApp - 应用壳层(shared)
 *
 * 模块定位：
 * - 所在层级：应用壳层(shared)
 * - 主要目标：承载共享库业务流程与 UI 组合
 *
 * 关键职责：
 * - 承载应用入口装配与页面级流程
 * - 协调共享模块与业务模块的组合
 * - 保证不同 MPA 入口行为一致且可维护
 *
 * 主要导出：
 * - `default:SharedApp`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../hooks/useEmailAuth`、`./SharedLoginPage`、`./SharedMainView`
 * - 下游影响：供 index.html 入口挂载
 */

import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecoveryMode(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleRecoveryComplete = () => {
        setIsRecoveryMode(false);
    };

    const handleRecoveryCancel = async () => {
        await signOut();
        setIsRecoveryMode(false);
        setAlertMessage('密码重置已取消，请重新登录');
    };

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
