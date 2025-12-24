/**
 * 同步到共享库弹窗
 * 卡片式布局，显示英雄头像和地图封面
 */
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Icon from '../../components/Icon';
import { syncLineupsToShared, getSyncableCount, SyncScope, SyncResult } from '../../lib/syncService';
import { supabase } from '../../supabaseClient';
import { checkAdminAccessByEmail } from '../../lib/adminService';
import { MAP_TRANSLATIONS } from '../../constants/maps';

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
    // 管理员验证表单
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // 同步选项
    const [selectedScope, setSelectedScope] = useState<SyncScope | null>(null);
    const [counts, setCounts] = useState<{ agent: { total: number; synced: number }; map: { total: number; synced: number } }>({
        agent: { total: 0, synced: 0 },
        map: { total: 0, synced: 0 },
    });
    const [isSyncing, setIsSyncing] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [isLoadingCounts, setIsLoadingCounts] = useState(false);

    const isVerified = !!verifiedAdminEmail;

    // 每次打开时重置选择状态
    useEffect(() => {
        if (isOpen) {
            setSelectedScope(null);
            setEmail('');
            setPassword('');
        }
    }, [isOpen]);

    // 获取待同步数量
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

    // 验证管理员身份
    const handleVerify = useCallback(async () => {
        if (!email || !password) {
            setAlertMessage('请输入邮箱和密码');
            return;
        }

        setIsVerifying(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setAlertMessage('邮箱或密码错误');
                setIsVerifying(false);
                return;
            }

            const adminAccess = await checkAdminAccessByEmail(email);
            await supabase.auth.signOut();

            if (!adminAccess.isAdmin) {
                setAlertMessage('该账号没有管理员权限');
                setIsVerifying(false);
                return;
            }

            setVerifiedAdminEmail(email);
            setAlertMessage('验证成功！');
        } catch {
            setAlertMessage('验证失败，请稍后再试');
        } finally {
            setIsVerifying(false);
        }
    }, [email, password, setAlertMessage, setVerifiedAdminEmail]);

    // 执行同步
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

    const handleLogout = () => {
        setVerifiedAdminEmail(null);
        setEmail('');
        setPassword('');
    };

    const handleClose = () => {
        if (isSyncing) return;
        onClose();
    };

    if (!isOpen) return null;

    const agentNew = counts.agent.total - counts.agent.synced;
    const mapNew = counts.map.total - counts.map.synced;

    const content = (
        <div className="fixed inset-0 z-[1500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            {/* 覆盖浏览器默认的 autofill 样式 */}
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #0f1923 inset !important;
                    -webkit-text-fill-color: white !important;
                    caret-color: white !important;
                    border-color: rgba(255, 255, 255, 0.08) !important;
                }
            `}</style>
            <div className="w-[400px] max-w-lg rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
                            <Icon name="Share2" size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xl font-bold text-white">同步到共享库</div>
                            <div className="text-xs text-gray-500">
                                {!isVerified ? '请先验证管理员身份' : '选择要同步的范围'}
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

                {/* Body */}
                <div className="p-5 bg-[#181b1f]">
                    {!isVerified ? (
                        // 管理员验证表单
                        <div className="space-y-4">
                            <div className="text-center py-2">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                    <Icon name="Shield" size={32} className="text-amber-400" />
                                </div>
                                <p className="text-white font-semibold mb-1">管理员身份验证</p>
                                <p className="text-gray-400 text-sm">请使用管理员邮箱和密码登录</p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">管理员邮箱</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full px-4 py-3 bg-[#0f1923] border border-white/[0.08] rounded-lg text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50 focus:border-[#ff4655] transition-colors"
                                    disabled={isVerifying}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">密码</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="输入密码"
                                    className="w-full px-4 py-3 bg-[#0f1923] border border-white/[0.08] rounded-lg text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50 focus:border-[#ff4655] transition-colors"
                                    disabled={isVerifying}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                />
                            </div>
                        </div>
                    ) : isSyncing ? (
                        // 同步中
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
                    ) : (
                        // 选择同步范围 - 卡片布局
                        <div className="space-y-4">
                            {/* 已验证提示 */}
                            <div className="flex items-center justify-between text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Icon name="CheckCircle" size={16} />
                                    <span>已验证：{verifiedAdminEmail}</span>
                                </div>
                                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-white">
                                    切换账号
                                </button>
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
                                // 卡片选择区
                                <div className="grid grid-cols-2 gap-4">
                                    {/* 同步当前地图所有点位 */}
                                    <button
                                        onClick={() => setSelectedScope(selectedScope === 'map' ? null : 'map')}
                                        disabled={counts.map.total === 0}
                                        className={`group rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors ${selectedScope === 'map'
                                            ? 'border-2 border-[#ff4655] bg-[#ff4655]/15'
                                            : 'border border-white/10 bg-white/5 hover:bg-white/10'
                                            } ${counts.map.total === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {/* 地图封面（圆形） */}
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

                                    {/* 同步当前英雄点位 */}
                                    <button
                                        onClick={() => setSelectedScope(selectedScope === 'agent' ? null : 'agent')}
                                        disabled={!currentAgentName || counts.agent.total === 0}
                                        className={`group rounded-2xl p-3 flex flex-col items-center gap-2 transition-colors ${selectedScope === 'agent'
                                            ? 'border-2 border-amber-400 bg-amber-500/20'
                                            : 'border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/15'
                                            } ${!currentAgentName || counts.agent.total === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {/* 英雄头像 */}
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
                    )}
                </div>

                {/* Footer */}
                {!isSyncing && (
                    <div className="px-5 py-4 border-t border-white/10 bg-[#1c2028] flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            {!isVerified ? '仅管理员可使用此功能' : '图片 URL 直接复用，无需重传'}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors"
                            >
                                取消
                            </button>

                            {!isVerified && (
                                <button
                                    onClick={handleVerify}
                                    disabled={isVerifying || !email || !password}
                                    className="px-5 py-2 rounded-lg bg-[#ff4655] hover:bg-[#ff5a67] text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-md shadow-[#ff4655]/30 disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        <>
                                            <Icon name="Loader" size={16} className="animate-spin" />
                                            验证中...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="Shield" size={16} />
                                            验证身份
                                        </>
                                    )}
                                </button>
                            )}

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
