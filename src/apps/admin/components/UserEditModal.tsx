/**
 * UserEditModal - 应用壳层(admin)
 *
 * 模块定位：
 * - 所在层级：应用壳层(admin)
 * - 主要目标：承载管理后台流程与页面路由
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `UserProfile`、`default:UserEditModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`react-dom`、`../../../components/Icon`、`../../../components/UserAvatar`
 * - 下游影响：供 admin.html 入口挂载
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Icon from '../../../components/Icon';
import { updateAvatarCache } from '../../../components/UserAvatar';
import { AGENT_AVATARS, getAvatarByEmail } from '../../../utils/avatarUtils';
import { loadPlayerCardAvatars, PlayerCardAvatar } from '../../../utils/playerCardAvatars';
import { useEscapeClose } from '../../../hooks/useEscapeClose';

export interface UserProfile {
    id: string;
    email: string;
    nickname: string | null;
    avatar: string | null;
    custom_id: string | null;
    is_banned: boolean;
    ban_reason: string | null;
    download_count: number;
    can_batch_download?: boolean;
    created_at: string;
    updated_at: string;
    role: 'user' | 'admin' | 'super_admin';
}

interface UserEditModalProps {
    isOpen: boolean;
    user: UserProfile | null;
    onClose: () => void;
    onSave: (userId: string, data: Partial<UserProfile>) => Promise<void>;
    isSubmitting: boolean;
}

function UserEditModal({ isOpen, user, onClose, onSave, isSubmitting }: UserEditModalProps) {
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState('');
    const [isBanned, setIsBanned] = useState(false);
    const [canBatchDownload, setCanBatchDownload] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
    const [playerCards, setPlayerCards] = useState<PlayerCardAvatar[]>([]);
    const [isLoadingCards, setIsLoadingCards] = useState(false);

    useEffect(() => {
        if (isAvatarPickerOpen && playerCards.length === 0) {
            setIsLoadingCards(true);
            loadPlayerCardAvatars()
                .then(cards => {
                    setPlayerCards(cards);
                })
                .catch(err => console.error('加载玩家卡面失败:', err))
                .finally(() => setIsLoadingCards(false));
        }
    }, [isAvatarPickerOpen, playerCards.length]);

    useEffect(() => {
        if (user) {
            setNickname(user.nickname || '');
            setAvatar(user.avatar || getAvatarByEmail(user.email));
            setIsBanned(user.is_banned);
            setCanBatchDownload(user.can_batch_download || false);
            setBanReason(user.ban_reason || '');
            setIsAvatarPickerOpen(false);
        }
    }, [user]);

    const getAvatarUrl = (avatarValue: string): string => {
        if (!avatarValue) return '/agents/KO.png';
        if (avatarValue.startsWith('http')) return avatarValue;
        return `/agents/${avatarValue}`;
    };

    useEscapeClose(isOpen, onClose);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(user.id, {
            nickname,
            avatar,
            is_banned: isBanned,
            can_batch_download: canBatchDownload,
            ban_reason: isBanned ? banReason : null,
        });
        updateAvatarCache(user.email, avatar);
    };

    const handleToggleBan = async () => {
        const newBanStatus = !isBanned;
        setIsBanned(newBanStatus);
        if (!newBanStatus) {
            setBanReason('');
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden relative">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
                            <Icon name="UserCog" size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xl font-bold text-white">编辑用户</div>
                            <div className="text-xs text-gray-500">管理用户信息与状态</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                        aria-label="关闭"
                    >
                        <Icon name="X" size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5 bg-[#181b1f]">
                    <div className="flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAvatarPickerOpen(true)}
                            className="relative w-20 h-20 rounded-xl border-2 border-white/10 overflow-hidden bg-[#0f131a] group hover:border-[#ff4655] transition-colors cursor-pointer"
                            title="点击更换头像"
                        >
                            <img
                                src={getAvatarUrl(avatar)}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Icon name="Camera" size={20} className="text-white" />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500">点击头像更换</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">昵称</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="未设置"
                            className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-[#ff4655] outline-none transition-colors"
                        />
                    </div>

                    <div className="bg-[#0f131a] rounded-xl p-4 space-y-2 border border-white/5 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">邮箱</span>
                            <span className="text-gray-300 font-mono">{user.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">自定义 ID</span>
                            <span className="text-gray-300 font-mono">{user.custom_id || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">注册时间</span>
                            <span className="text-gray-300">{new Date(user.created_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">账户状态</span>
                        <span className={isBanned ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
                            {isBanned ? '已禁用' : '正常'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">批量下载</span>
                        <button
                            type="button"
                            onClick={() => setCanBatchDownload(!canBatchDownload)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${canBatchDownload ? 'bg-[#ff4655]' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${canBatchDownload ? 'left-5.5 translate-x-0' : 'left-0.5'}`} style={{ left: canBatchDownload ? '22px' : '2px' }} />
                        </button>
                    </div>

                    {isBanned && (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">禁用原因</label>
                            <input
                                type="text"
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="请输入禁用原因（可选）"
                                className="w-full px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            />
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={handleToggleBan}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isBanned
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                }`}
                        >
                            {isBanned ? '解除禁用' : '禁用账户'}
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-red-900/30"
                            >
                                {isSubmitting && <Icon name="Loader2" size={16} className="animate-spin" />}
                                保存
                            </button>
                        </div>
                    </div>
                </form>

                {isAvatarPickerOpen && (
                    <div className="absolute inset-0 bg-[#181b1f] z-10 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#1c2028]">
                            <span className="text-sm font-bold text-white">选择玩家卡面</span>
                            <button onClick={() => setIsAvatarPickerOpen(false)} className="text-gray-400 hover:text-white">
                                <Icon name="X" size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {isLoadingCards ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="w-6 h-6 border-2 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : playerCards.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">
                                    <p>无法加载卡面数据</p>
                                    <p className="text-xs mt-1">请检查网络连接</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {playerCards.map((card) => (
                                        <button
                                            key={card.uuid}
                                            type="button"
                                            onClick={() => {
                                                setAvatar(card.url);
                                                setIsAvatarPickerOpen(false);
                                            }}
                                            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${avatar === card.url
                                                ? 'border-[#ff4655] scale-110 shadow-lg shadow-[#ff4655]/20'
                                                : 'border-white/10 hover:border-white/50 hover:scale-105'
                                                }`}
                                            title={card.name}
                                        >
                                            <img src={card.url} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div >
        </div >,
        document.body
    );
}

export default UserEditModal;
