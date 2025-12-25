/**
 * UserApp - 共享库个人中心根组件
 * 
 * 职责：
 * - 实现用户注册、登录及重置密码流程
 * - 展示用户个人点位投稿记录及状态 (Pending/Approved/Rejected)
 * - 与共享库主应用 (SharedApp) 共享某些公共组件
 */
import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/fonts.css';
import '../../index.css';
import 'leaflet/dist/leaflet.css';
import MainView from '../../features/lineups/MainView';
import AppModals from '../../features/lineups/AppModals';
import { useAppController } from '../../features/lineups/useAppController';
import SyncToSharedModal from '../shared/SyncToSharedModal';
import PendingSubmissionsDrawer from './PendingSubmissionsDrawer';
import SharedLoginPage from '../shared/SharedLoginPage';
import UserProfileModal from '../shared/components/UserProfileModal';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { submitLineupDirectly, checkDailySubmissionLimit } from '../../lib/submissionUpload';

/**
 * 个人库应用根组件
 * 使用 Supabase Auth 统一认证
 */
function UserApp() {
    const { user, isLoading } = useEmailAuth();
    const { profile } = useUserProfile();
    const { mainViewProps, modalProps, isProfileModalOpen, setIsProfileModalOpen, orderedLineups } = useAppController();

    // 同步弹窗状态
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    // 待审点位抽屉状态
    const [isPendingDrawerOpen, setIsPendingDrawerOpen] = useState(false);
    // 投稿进行中状态
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isAlertFading, setIsAlertFading] = useState(false);

    // 管理员验证状态（持久化，关闭弹窗后保持）
    const [verifiedAdminEmail, setVerifiedAdminEmail] = useState<string | null>(null);

    // 判断当前用户是否为管理员
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    // 直接投稿点位
    const handleSubmitLineup = useCallback(async (lineupId: string) => {
        if (!user || isSubmitting) return;

        // 从 orderedLineups 中找到点位数据
        const lineup = orderedLineups.find((l) => l.id === lineupId);
        if (!lineup) {
            setAlertMessage('找不到点位数据');
            return;
        }

        // 检查投稿限制
        const { allowed, remaining } = await checkDailySubmissionLimit(user.id);
        if (!allowed) {
            setAlertMessage('今日投稿次数已达上限，请明天再试');
            return;
        }

        // 确认投稿
        const confirmed = window.confirm(`确定要投稿「${lineup.title}」吗？\n\n今日剩余投稿次数: ${remaining}`);
        if (!confirmed) return;

        setIsSubmitting(true);
        setAlertMessage('正在投稿，上传图片中...');

        const result = await submitLineupDirectly(
            lineup,
            user.id,
            profile?.custom_id || profile?.nickname || user.email || undefined, // 优先使用 custom_id
            (progress) => {
                if (progress.status === 'uploading') {
                    setAlertMessage(`上传图片中 (${progress.uploadedCount}/${progress.totalImages})`);
                } else if (progress.status === 'saving') {
                    setAlertMessage('保存投稿记录...');
                }
            }
        );

        setIsSubmitting(false);

        if (result.success) {
            setAlertMessage('投稿成功！等待管理员审核');
        } else {
            setAlertMessage(`投稿失败: ${result.errorMessage}`);
        }
    }, [user, orderedLineups, isSubmitting]);

    // Alert 自动消失（5秒后渐隐）
    useEffect(() => {
        if (alertMessage) {
            setIsAlertFading(false);
            const fadeTimer = setTimeout(() => {
                setIsAlertFading(true);
            }, 4500); // 4.5秒后开始渐隐

            const hideTimer = setTimeout(() => {
                setAlertMessage(null);
                setIsAlertFading(false);
            }, 5000); // 5秒后完全隐藏

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [alertMessage]);

    // 加载中状态
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f1923] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // 未登录时显示登录页面
    if (!user) {
        return <SharedLoginPage setAlertMessage={setAlertMessage} />;
    }

    // 扩展 quickActions 和 right props - 根据用户角色显示不同按钮
    const extendedMainViewProps = {
        ...mainViewProps,
        quickActions: {
            ...mainViewProps.quickActions,
            isAdmin,
            onSyncToShared: isAdmin ? () => setIsSyncModalOpen(true) : undefined,
            // 普通用户：待审点位按钮 → 打开待审抽屉
            onPendingSubmissions: !isAdmin ? () => setIsPendingDrawerOpen(true) : undefined,
        },
        right: {
            ...mainViewProps.right,
            isAdmin,
            // 普通用户：卡片列表投稿按钮 → 直接投稿
            onSubmitLineup: !isAdmin ? handleSubmitLineup : undefined,
        },
    };

    // 获取当前地图和英雄信息
    const currentMap = mainViewProps?.left?.selectedMap;
    const currentAgent = mainViewProps?.left?.selectedAgent;

    // 获取个人库用户 ID（使用 Supabase User UUID）
    const personalUserId = user.id;

    // 获取地图封面 URL
    const mapCover = mainViewProps?.map?.mapCover;

    return (
        <>
            <MainView {...extendedMainViewProps} />
            <AppModals
                {...modalProps}
                onSubmitLineup={!isAdmin ? handleSubmitLineup : undefined}
                isAdmin={isAdmin}
            />

            {/* 同步到共享库弹窗（管理员） */}
            <SyncToSharedModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                personalUserId={personalUserId}
                currentMapName={currentMap?.displayName}
                currentMapIcon={mapCover || currentMap?.displayIcon}
                currentAgentName={currentAgent?.displayName}
                currentAgentIcon={currentAgent?.displayIcon}
                setAlertMessage={(msg) => setAlertMessage(msg)}
                verifiedAdminEmail={verifiedAdminEmail}
                setVerifiedAdminEmail={setVerifiedAdminEmail}
            />

            {/* 待审点位抽屉（普通用户 - QuickActions 触发） */}
            <PendingSubmissionsDrawer
                isOpen={isPendingDrawerOpen}
                onClose={() => setIsPendingDrawerOpen(false)}
                userId={personalUserId}
            />

            {/* 个人信息弹窗 */}
            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                setAlertMessage={(msg) => setAlertMessage(msg)}
            />

            {/* Alert 提示 - 5秒后渐隐消失 */}
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

export default UserApp;
