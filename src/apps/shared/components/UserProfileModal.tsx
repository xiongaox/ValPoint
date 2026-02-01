/**
 * UserProfileModal - 共享库用户资料弹窗
 *
 * 职责：
 * - 渲染共享库用户资料弹窗内容与操作区域。
 * - 处理打开/关闭、确认/取消等交互。
 * - 与表单校验或数据提交逻辑联动。
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../../../components/Icon';
import { updateAvatarCache } from '../../../components/UserAvatar';
import { useUserProfile } from '../../../hooks/useUserProfile';

import { useEscapeClose } from '../../../hooks/useEscapeClose';
import {
    PlayerCardAvatar,
    loadPlayerCardAvatars,
    getPlayerCardByEmail,
    getDefaultPlayerCardAvatar
} from '../../../utils/playerCardAvatars';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    setAlertMessage: (msg: string | null) => void;
};

const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, setAlertMessage }) => {
    const { profile, updateProfile, isLoading: isProfileLoading } = useUserProfile();
    const [nickname, setNickname] = useState('');
    const defaultAvatar = getDefaultPlayerCardAvatar();
    const [currentAvatar, setCurrentAvatar] = useState(defaultAvatar);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    const [playerCards, setPlayerCards] = useState<PlayerCardAvatar[]>([]);
    const [isLoadingCards, setIsLoadingCards] = useState(false);

    const [visibleCount, setVisibleCount] = useState(48); // 说明：初始显示 48 个（约 4x6 或 12x4）。
    const visibleCards = useMemo(() => playerCards.slice(0, visibleCount), [playerCards, visibleCount]);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAvatarPickerOpen || isLoadingCards || visibleCount >= playerCards.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + 48, playerCards.length));
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [isAvatarPickerOpen, isLoadingCards, playerCards.length, visibleCount]);

    useEffect(() => {

        if (isOpen && profile) {
            setNickname(profile.nickname || '');
            setCurrentAvatar(profile.avatar || defaultAvatar);
            setIsAvatarPickerOpen(false);
        }
    }, [isOpen, profile]);

    useEffect(() => {
        if (isAvatarPickerOpen && playerCards.length === 0 && !isLoadingCards) {
            setIsLoadingCards(true);
            loadPlayerCardAvatars()
                .then(cards => setPlayerCards(cards))
                .catch(err => console.error('加载卡面失败:', err))
                .finally(() => setIsLoadingCards(false));
        }
    }, [isAvatarPickerOpen, playerCards.length, isLoadingCards]);

    useEscapeClose(isOpen, onClose);

    if (!isOpen) return null;

    if (isProfileLoading) {
        return (
            <div className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleSave = async () => {
        if (!profile) return;
        setIsSubmitting(true);

        const updateData: any = {
            nickname,
            avatar: currentAvatar
        };

        const { success, error } = await updateProfile(updateData);
        setIsSubmitting(false);

        if (success) {
            // Note: removed updateAvatarCache since we don't have user email anymore and local mode might not need it or handles it differently
            setAlertMessage('个人信息已更新');
            onClose();
        } else {
            setAlertMessage(error || '更新失败');
        }
    };

    return (
        <div
            className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden relative">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
                            <Icon name="User" size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xl font-bold text-white">个人信息</div>
                            <div className="text-xs text-gray-500">修改昵称与头像</div>
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

                <div className="p-5 space-y-6 bg-[#181b1f]">
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => setIsAvatarPickerOpen(true)}
                            className="relative w-24 h-24 rounded-xl border-2 border-white/10 overflow-hidden bg-[#0f131a] group hover:border-[#ff4655] transition-colors cursor-pointer"
                            title="点击更换头像"
                        >
                            <img
                                src={currentAvatar.startsWith('http') || currentAvatar.startsWith('/') ? currentAvatar : `/agents/${currentAvatar}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Icon name="Camera" size={24} className="text-white" />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500">点击头像更换</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-400">用户昵称</label>
                            <span className="text-xs text-gray-500 font-mono">
                                {nickname.length}/8 (仅限大写英文字母与数字)
                            </span>
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                    if (val.length <= 8) {
                                        setNickname(val);
                                    }
                                }}
                                placeholder="设置一个响亮的代号"
                                className="w-full bg-[#0f131a] border border-white/10 rounded-lg pl-3 pr-10 py-2 text-base text-white focus:border-[#ff4655] outline-none transition-colors font-mono tracking-wide"
                                maxLength={8}
                            />
                            <button
                                onClick={() => {
                                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                    let result = '';
                                    for (let i = 0; i < 8; i++) {
                                        result += chars.charAt(Math.floor(Math.random() * chars.length));
                                    }
                                    setNickname(result);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-[#ff4655] hover:bg-[#ff4655]/10 rounded-md transition-all active:scale-95"
                                title="随机代号"
                            >
                                <Icon name="RefreshCcw" size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors"
                            disabled={isSubmitting}
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-red-900/30"
                        >
                            {isSubmitting && <Icon name="Loader2" size={16} className="animate-spin" />}
                            保存修改
                        </button>
                    </div>
                </div>

                {isAvatarPickerOpen && (
                    <div
                        className="absolute inset-0 bg-[#181b1f] z-10 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#1c2028]">
                            <span className="text-sm font-bold text-white">选择卡面头像 ({playerCards.length})</span>
                            <button onClick={() => setIsAvatarPickerOpen(false)} className="text-gray-400 hover:text-white">
                                <Icon name="X" size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {isLoadingCards ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="w-8 h-8 border-4 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {visibleCards.map((card) => (
                                        <button
                                            key={card.uuid}
                                            onClick={(e) => {
                                                e.stopPropagation(); // 说明：阻止冒泡以保持弹窗打开。
                                                setCurrentAvatar(card.url);
                                                setIsAvatarPickerOpen(false);
                                            }}
                                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${currentAvatar === card.url
                                                ? 'border-[#ff4655] scale-110 shadow-lg shadow-[#ff4655]/20'
                                                : 'border-white/10 hover:border-white/50 hover:scale-105'
                                                }`}
                                            title={card.name}
                                        >
                                            <img src={card.url} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                    {visibleCount < playerCards.length && (
                                        <div ref={loadMoreRef} className="col-span-4 py-4 flex justify-center">
                                            <div className="w-6 h-6 border-2 border-white/20 border-t-[#ff4655] rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileModal;
