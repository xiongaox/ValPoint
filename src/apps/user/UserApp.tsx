/**
 * UserApp - 应用壳层(user)
 *
 * 模块定位：
 * - 所在层级：应用壳层(user)
 * - 主要目标：承载个人库业务流程与 UI 组合
 *
 * 关键职责：
 * - 承载应用入口装配与页面级流程
 * - 协调共享模块与业务模块的组合
 * - 保证不同 MPA 入口行为一致且可维护
 *
 * 主要导出：
 * - `default:UserApp`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../../features/lineups/MainView`、`../../features/lineups/AppModals`、`../../features/lineups/useAppController`
 * - 下游影响：供 user.html 入口挂载
 */

import React, { useState, useEffect, useCallback } from 'react';

import '../../index.css';
import 'leaflet/dist/leaflet.css';
import MainView from '../../features/lineups/MainView';
import AppModals from '../../features/lineups/AppModals';
import { useAppController } from '../../features/lineups/useAppController';
import SyncToSharedModal from '../shared/SyncToSharedModal';
import PendingSubmissionsDrawer from './PendingSubmissionsDrawer';
import AlertModal from '../../components/AlertModal';
import SharedLoginPage from '../shared/SharedLoginPage';
import UserProfileModal from '../shared/components/UserProfileModal';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { submitLineupDirectly, checkDailySubmissionLimit } from '../../lib/submissionUpload';

function UserApp() {
    const { user, isLoading } = useEmailAuth();
    const { profile } = useUserProfile();
    const { mainViewProps, modalProps, isProfileModalOpen, setIsProfileModalOpen, orderedLineups } = useAppController();

    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [isPendingDrawerOpen, setIsPendingDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isAlertFading, setIsAlertFading] = useState(false);
    const [confirmState, setConfirmState] = useState<{
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const [verifiedAdminEmail, setVerifiedAdminEmail] = useState<string | null>(null);

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    const handleSubmitLineup = useCallback(async (lineupId: string) => {
        if (!user || isSubmitting) return;

        const lineup = orderedLineups.find((l) => l.id === lineupId);
        if (!lineup) {
            setAlertMessage('找不到点位数据');
            return;
        }

        const { allowed, remaining } = await checkDailySubmissionLimit(user.id);
        if (!allowed) {
            setAlertMessage('今日投稿次数已达上限，请明天再试');
            return;
        }

        setConfirmState({
            message: `确定要投稿「${lineup.title}」吗？\n\n今日剩余投稿次数: ${remaining}`,
            onConfirm: async () => {
                setConfirmState(null);
                setIsSubmitting(true);
                setAlertMessage('正在投稿，上传图片中...');

                const result = await submitLineupDirectly(
                    lineup,
                    user.id,
                    profile?.custom_id || profile?.nickname || user.email || undefined,
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
            }
        });
    }, [user, orderedLineups, isSubmitting, profile]);

    useEffect(() => {
        if (alertMessage) {
            setIsAlertFading(false);
            const fadeTimer = setTimeout(() => {
                setIsAlertFading(true);
            }, 4500); // 说明：4.5 秒后开始渐隐。

            const hideTimer = setTimeout(() => {
                setAlertMessage(null);
                setIsAlertFading(false);
            }, 5000); // 说明：5 秒后完全隐藏。

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

    if (!user) {
        return <SharedLoginPage setAlertMessage={setAlertMessage} />;
    }

    const extendedMainViewProps = {
        ...mainViewProps,
        quickActions: {
            ...mainViewProps.quickActions,
            isAdmin,
            onSyncToShared: isAdmin ? () => setIsSyncModalOpen(true) : undefined,
            onPendingSubmissions: !isAdmin ? () => setIsPendingDrawerOpen(true) : undefined,
        },
        right: {
            ...mainViewProps.right,
            isAdmin,
            onSubmitLineup: !isAdmin ? handleSubmitLineup : undefined,
        },
    };

    const currentMap = mainViewProps?.left?.selectedMap;
    const currentAgent = mainViewProps?.left?.selectedAgent;

    const personalUserId = user.id;

    const mapCover = mainViewProps?.map?.mapCover;

    return (
        <>
            <MainView {...extendedMainViewProps} />
            <AppModals
                {...modalProps}
                onSubmitLineup={!isAdmin ? handleSubmitLineup : undefined}
                isAdmin={isAdmin}
            />

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

            <PendingSubmissionsDrawer
                isOpen={isPendingDrawerOpen}
                onClose={() => setIsPendingDrawerOpen(false)}
                userId={personalUserId}
            />

            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                setAlertMessage={(msg) => setAlertMessage(msg)}
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

export default UserApp;
