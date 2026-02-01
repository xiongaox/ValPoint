/**
 * App - ValPoint 核心应用入口 (Docker 本地版)
 *
 * 职责：
 * - 渲染核心界面结构与样式。
 * - 处理用户交互与本地数据流。
 * - 组合地图、特工及点位展示组件。
 */

import React, { useState, useEffect, useCallback } from 'react';

import './index.css';
import 'leaflet/dist/leaflet.css';
import MainView from './features/lineups/MainView';
import AppModals from './features/lineups/AppModals';
import { useAppController } from './features/lineups/useAppController';
import AlertModal from './components/AlertModal';
import { useEmailAuth } from './hooks/useEmailAuth';
import { useUserProfile } from './hooks/useUserProfile';

function App() {
    const { user, isLoading } = useEmailAuth();
    const { profile } = useUserProfile();
    const { mainViewProps, modalProps, isProfileModalOpen, setIsProfileModalOpen, orderedLineups } = useAppController();

    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isAlertFading, setIsAlertFading] = useState(false);
    const [confirmState, setConfirmState] = useState<{
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    // 自动淡出警告信息
    useEffect(() => {
        if (alertMessage) {
            setIsAlertFading(false);
            const fadeTimer = setTimeout(() => {
                setIsAlertFading(true);
            }, 4500);

            const hideTimer = setTimeout(() => {
                setAlertMessage(null);
                setIsAlertFading(false);
            }, 5000);

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [alertMessage]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f1923] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // 本地版默认 user 始终存在（Mock 逻辑），如果不存在则显示基础载入状态
    if (!user) {
        return (
            <div className="min-h-screen bg-[#0f1923] flex items-center justify-center text-white">
                Initializing Local Data...
            </div>
        );
    }

    const extendedMainViewProps = {
        ...mainViewProps,
        quickActions: {
            ...mainViewProps.quickActions,
            isAdmin,
            // 移除已弃用的同步/待定入口
            onSyncToShared: undefined,
            onPendingSubmissions: undefined,
        },
        right: {
            ...mainViewProps.right,
            isAdmin,
            onSubmitLineup: undefined, // 本地版直接保存，无需投稿流程
        },
    };

    return (
        <>
            <MainView {...extendedMainViewProps} />
            <AppModals
                {...modalProps}
                onSubmitLineup={undefined}
                isAdmin={isAdmin}
            />

            <AlertModal
                message={confirmState?.message ?? null}
                onClose={() => setConfirmState(null)}
                actionLabel="取消"
                secondaryLabel="确定"
                onSecondary={confirmState?.onConfirm}
            />

            {alertMessage && (
                <div
                    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-[#1f2326] border border-white/10 rounded-xl px-6 py-3 shadow-xl transition-opacity duration-500 ${isAlertFading ? 'opacity-0' : 'opacity-100'}`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-white text-sm">{alertMessage}</span>
                        <button
                            onClick={() => setAlertMessage(null)}
                            className="text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default App;
