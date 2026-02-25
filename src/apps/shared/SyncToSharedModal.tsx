/**
 * SyncToSharedModal - 应用壳层(shared)
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
 * - `default:SyncToSharedModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`react-dom`、`../../components/Icon`、`../../lib/syncService`
 * - 下游影响：供 index.html 入口挂载
 */

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Icon from '../../components/Icon';
import { syncLineupsToShared, getSyncableCount, SyncScope, SyncResult } from '../../lib/syncService';
import { checkAdminAccessByEmail } from '../../lib/adminService';
import { MAP_TRANSLATIONS } from '../../constants/maps';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import { useEscapeClose } from '../../hooks/useEscapeClose';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    personalUserId: string;
    currentMapName?: string;
    currentMapIcon?: string | null;
    currentAgentName?: string;
    currentAgentIcon?: string | null;
    setAlertMessage: (msg: string) => void;
    verifiedAdminEmail: string | null;
    setVerifiedAdminEmail: (email: string | null) => void;
}

const SyncToSharedModal: React.FC<Props> = ({
    isOpen,
    onClose,
    personalUserId,
    currentMapName,
    currentMapIcon,
    currentAgentName,
    currentAgentIcon,
    setAlertMessage,
    verifiedAdminEmail,
    setVerifiedAdminEmail,
}) => {
    const { user } = useEmailAuth();

    const [selectedScope, setSelectedScope] = useState<SyncScope | null>(null);
    const [counts, setCounts] = useState<{ agent: { total: number; synced: number }; map: { total: number; synced: number } }>({
        agent: { total: 0, synced: 0 },
        map: { total: 0, synced: 0 },
    });
    const [isSyncing, setIsSyncing] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [isLoadingCounts, setIsLoadingCounts] = useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
    const [adminCheckFailed, setAdminCheckFailed] = useState(false);

    const isVerified = !!verifiedAdminEmail;

    useEffect(() => {
        if (isOpen) {
            setSelectedScope(null);
            setAdminCheckFailed(false);

            if (verifiedAdminEmail) return;

            if (user?.email) {
                setIsCheckingAdmin(true);
                checkAdminAccessByEmail(user.email)
                    .then((result) => {
                        if (result.isAdmin) {
                            setVerifiedAdminEmail(user.email!);
                        } else {
                            setAdminCheckFailed(true);
                        }
                    })
                    .catch((err) => {
                        console.error('检查管理员状态失败:', err);
                        setAdminCheckFailed(true);
                    })
                    .finally(() => {
                        setIsCheckingAdmin(false);
                    });
            }
        }
    }, [isOpen, user?.email, verifiedAdminEmail, setVerifiedAdminEmail]);

    useEffect(() => {
        if (!isOpen || !isVerified || !personalUserId) return;

        const fetchCounts = async () => {
            setIsLoadingCounts(true);
            try {
                const [agentCount, mapCount] = await Promise.all([
                    currentAgentName
                        ? getSyncableCount(personalUserId, 'agent', currentMapName, currentAgentName)
                        : Promise.resolve({ total: 0, synced: 0 }),
                    currentMapName
                        ? getSyncableCount(personalUserId, 'map', currentMapName)
                        : Promise.resolve({ total: 0, synced: 0 }),
                ]);
                setCounts({ agent: agentCount, map: mapCount });
            } catch (error) {
                console.error('获取同步数量失败:', error);
            } finally {
                setIsLoadingCounts(false);
            }
        };

        fetchCounts();
    }, [isOpen, isVerified, personalUserId, currentMapName, currentAgentName]);

    const handleSync = useCallback(async () => {
        if (!selectedScope || !verifiedAdminEmail) return;

        setIsSyncing(true);
        setProgress({ current: 0, total: 0 });

        const result: SyncResult = await syncLineupsToShared(
            {
                userId: personalUserId,
                scope: selectedScope,
                mapName: currentMapName,
                agentName: selectedScope === 'agent' ? currentAgentName : undefined,
                adminEmail: verifiedAdminEmail,
            },
            (current, total) => setProgress({ current, total }),
        );

        setIsSyncing(false);
        setProgress(null);

        if (result.success) {
            if (result.syncedCount === 0 && result.skippedCount > 0) {
                setAlertMessage(`所有 ${result.skippedCount} 个点位已同步过`);
            } else if (result.syncedCount > 0) {
                setAlertMessage(`成功同步 ${result.syncedCount} 个点位${result.skippedCount > 0 ? `，跳过 ${result.skippedCount} 个已同步` : ''}`);
            } else {
                setAlertMessage(result.errorMessage || '没有点位需要同步');
            }
            onClose();
        } else {
            setAlertMessage(result.errorMessage || '同步失败');
        }
    }, [selectedScope, personalUserId, currentMapName, currentAgentName, verifiedAdminEmail, setAlertMessage, onClose]);

    const handleClose = () => {
        if (isSyncing) return;
        onClose();
    };

    useEscapeClose(isOpen, handleClose);

    if (!isOpen) return null;

    const agentNew = counts.agent.total - counts.agent.synced;
    const mapNew = counts.map.total - counts.map.synced;

    const content = (
        <div className="fixed inset-0 z-[1500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-[400px] max-w-lg rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
                            <Icon name="Share2" size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xl font-bold text-white">同步到共享库</div>
                            <div className="text-xs text-gray-500">
                                {isCheckingAdmin ? '权限检测中...' : isVerified ? '选择要同步的范围' : '需要管理员权限'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSyncing}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                    >
                        <Icon name="X" size={16} />
                    </button>
                </div>

                <div className="p-5 bg-[#181b1f]">
                    {isCheckingAdmin ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff4655]/10 border border-[#ff4655]/30 flex items-center justify-center">
                                <Icon name="Loader" size={32} className="text-[#ff4655] animate-spin" />
                            </div>
                            <p className="text-white font-semibold mb-2">正在检测权限</p>
                            <p className="text-gray-400 text-sm">请稍候...</p>
                        </div>
                    ) : adminCheckFailed ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                <Icon name="ShieldX" size={32} className="text-red-400" />
                            </div>
                            <p className="text-white font-semibold mb-2">无管理员权限</p>
                            <p className="text-gray-400 text-sm">当前账号 ({user?.email}) 不是管理员</p>
                        </div>
                    ) : isSyncing ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff4655]/10 border border-[#ff4655]/30 flex items-center justify-center">
                                <Icon name="Loader" size={32} className="text-[#ff4655] animate-spin" />
                            </div>
                            <p className="text-white font-semibold mb-2">
                                正在同步 ({progress?.current}/{progress?.total})
                            </p>
                            <p className="text-gray-400 text-sm">请稍候...</p>
                            {progress && progress.total > 0 && (
                                <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-xs mx-auto">
                                    <div
                                        className="h-full bg-[#ff4655] transition-all duration-300"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    ) : isVerified ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Icon name="CheckCircle" size={16} />
                                    <span>管理员：{verifiedAdminEmail}</span>
                                </div>
                            </div>

                            {isLoadingCounts ? (
                                <div className="flex items-center justify-center py-12">
                                    <Icon name="Loader" size={32} className="text-gray-500 animate-spin" />
                                </div>
                            ) : !currentMapName ? (
                                <div className="text-center py-8 text-gray-500">
                                    请先在左侧选择地图
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setSelectedScope(selectedScope === 'map' ? null : 'map')}
                                        disabled={counts.map.total === 0}
                                        className={`group rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors ${selectedScope === 'map'
                                            ? 'border-2 border-[#ff4655] bg-[#ff4655]/15'
                                            : 'border border-white/10 bg-white/5 hover:bg-white/10'
                                            } ${counts.map.total === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="w-14 h-14 rounded-full border-2 border-[#ff4655]/50 overflow-hidden bg-[#1f2326]">
                                            {currentMapIcon ? (
                                                <img
                                                    src={currentMapIcon}
                                                    alt={currentMapName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#ff4655]">
                                                    <Icon name="Map" size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-white font-semibold text-sm">同步地图点位</div>
                                        <div className="text-xs text-gray-400">当前：{currentMapName ? (MAP_TRANSLATIONS[currentMapName] || currentMapName) : '未选择'}</div>
                                        <div className={`text-xs font-semibold ${mapNew > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                            {mapNew > 0 ? `+${mapNew} 新点位` : '已全部同步'}
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setSelectedScope(selectedScope === 'agent' ? null : 'agent')}
                                        disabled={!currentAgentName || counts.agent.total === 0}
                                        className={`group rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors ${selectedScope === 'agent'
                                            ? 'border-2 border-amber-400 bg-amber-500/20'
                                            : 'border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/15'
                                            } ${!currentAgentName || counts.agent.total === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="w-14 h-14 rounded-full border-2 border-amber-500/50 overflow-hidden bg-[#1f2326]">
                                            {currentAgentIcon ? (
                                                <img
                                                    src={currentAgentIcon}
                                                    alt={currentAgentName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-amber-400">
                                                    <Icon name="User" size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-white font-semibold text-sm">同步英雄点位</div>
                                        <div className="text-xs text-amber-200/80">当前：{currentAgentName || '未选择'}</div>
                                        <div className={`text-xs font-semibold ${agentNew > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                                            {!currentAgentName ? '请先选择英雄' : agentNew > 0 ? `+${agentNew} 新点位` : '已全部同步'}
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {!isSyncing && (
                    <div className="px-5 py-4 border-t border-white/10 bg-[#1c2028] flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            {isVerified ? '图片 URL 直接复用，无需重传' : '仅管理员可使用此功能'}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors"
                            >
                                {adminCheckFailed ? '关闭' : '取消'}
                            </button>

                            {isVerified && selectedScope && (
                                <button
                                    onClick={handleSync}
                                    className="px-5 py-2 rounded-lg bg-[#ff4655] hover:bg-[#ff5a67] text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-md shadow-[#ff4655]/30"
                                >
                                    <Icon name="Share2" size={16} />
                                    开始同步
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(content, document.body);
};

export default SyncToSharedModal;
