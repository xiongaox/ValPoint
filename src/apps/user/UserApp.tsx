import React, { useState, useEffect } from 'react';
import '../../styles/fonts.css';
import '../../index.css';
import 'leaflet/dist/leaflet.css';
import MainView from '../../features/lineups/MainView';
import AppModals from '../../features/lineups/AppModals';
import { useAppController } from '../../features/lineups/useAppController';
import SyncToSharedModal from '../shared/SyncToSharedModal';

/**
 * 个人库应用根组件
 * 保持与原 App.tsx 相同的功能
 */
function UserApp() {
    const { mainViewProps, modalProps } = useAppController();

    // 同步弹窗状态
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isAlertFading, setIsAlertFading] = useState(false);

    // 管理员验证状态（持久化，关闭弹窗后保持）
    const [verifiedAdminEmail, setVerifiedAdminEmail] = useState<string | null>(null);

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

    // 扩展 quickActions props - 按钮对所有人可见
    const extendedMainViewProps = {
        ...mainViewProps,
        quickActions: {
            ...mainViewProps.quickActions,
            isAdmin: true,  // 按钮始终可见，验证在弹窗内进行
            onSyncToShared: () => setIsSyncModalOpen(true),
        },
    };

    // 获取当前地图和英雄信息
    const currentMap = mainViewProps?.left?.selectedMap;
    const currentAgent = mainViewProps?.left?.selectedAgent;

    // 获取个人库用户 ID
    const personalUserId = mainViewProps?.right?.userId || '';

    // 获取地图封面 URL
    const mapCover = mainViewProps?.map?.mapCover;

    return (
        <>
            <MainView {...extendedMainViewProps} />
            <AppModals {...modalProps} />

            {/* 同步到共享库弹窗 */}
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
