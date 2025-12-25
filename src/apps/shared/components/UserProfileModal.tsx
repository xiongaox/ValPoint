/**
 * UserProfileModal - 共享库个人信息编辑弹窗
 * 
 * 职责：
 * - 允许登录用户修改昵称、头像
 * - 展示用户绑定的邮箱、UUID 及注册日期
 * - 处理用户个人资料的异步更新
 */
import React, { useState, useEffect } from 'react';
import Icon from '../../../components/Icon';
import { updateAvatarCache } from '../../../components/UserAvatar';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { useEmailAuth } from '../../../hooks/useEmailAuth';
import { AGENT_AVATARS, getAvatarByUserId, getAvatarByEmail } from '../../../utils/avatarUtils';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    setAlertMessage: (msg: string | null) => void;
};

const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, setAlertMessage }) => {
    const { user } = useEmailAuth();
    const { profile, updateProfile, isLoading: isProfileLoading } = useUserProfile();
    const [nickname, setNickname] = useState('');
    // 使用用户邮箱生成确定性随机默认头像，以保持与 UserAvatar 一致
    const defaultAvatar = user?.email ? getAvatarByEmail(user.email) : '捷风.png';
    const [currentAvatar, setCurrentAvatar] = useState(defaultAvatar);
    const [pendingId, setPendingId] = useState<string | null>(null); // 用于补填的 ID
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    // 生成随机 ID：8位 大写字母+数字
    const generateId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let res = '';
        for (let i = 0; i < 8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
        return res;
    };

    useEffect(() => {
        if (isOpen && profile) {
            // 从 user_profiles 表读取数据
            setNickname(profile.nickname || '');
            setCurrentAvatar(profile.avatar || defaultAvatar);
            setIsAvatarPickerOpen(false);

            // 如果老用户没有 ID，生成一个待保存
            if (!profile.custom_id) {
                setPendingId(generateId());
            } else {
                setPendingId(null);
            }
        }
    }, [isOpen, profile]);

    if (!isOpen) return null;

    // 加载中状态
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

        // 如果有待补填的 ID，一起保存
        if (pendingId) {
            updateData.custom_id = pendingId;
            // 如果之前没有昵称，默认也设为这个 ID
            if (!nickname) updateData.nickname = pendingId;
        }

        // [Admin Override] 如果昵称设置为 VALPOINT，强制将 ID 也改为 VALPOINT
        if (nickname === 'VALPOINT') {
            updateData.custom_id = 'VALPOINT';
        }

        const { success, error } = await updateProfile(updateData);
        setIsSubmitting(false);

        if (success) {
            // 更新头像缓存，确保所有组件立即显示新头像
            if (user?.email) {
                updateAvatarCache(user.email, currentAvatar);
            }
            setAlertMessage('个人信息已更新');
            onClose();
        } else {
            setAlertMessage(error || '更新失败');
        }
    };

    return (
        <div className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden relative">
                {/* Header */}
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

                {/* Body */}
                <div className="p-5 space-y-6 bg-[#181b1f]">
                    {/* 头像设置 */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => setIsAvatarPickerOpen(true)}
                            className="relative w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden bg-[#0f131a] group hover:border-[#ff4655] transition-colors cursor-pointer"
                            title="点击更换头像"
                        >
                            <img
                                src={`/agents/${currentAvatar}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Icon name="Camera" size={24} className="text-white" />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500">点击头像更换</span>
                    </div>

                    {/* 昵称设置 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-400">用户昵称</label>
                            <span className="text-xs text-gray-500">
                                关联邮箱: <span className="text-gray-300">{user?.email}</span>
                            </span>
                        </div>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => {
                                // 强制大写，只允许 A-Z 和 0-9
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                if (val.length <= 8) {
                                    setNickname(val);
                                }
                            }}
                            placeholder="设置一个响亮的代号"
                            className="w-full bg-[#0f131a] border border-white/10 rounded-lg px-3 py-2 text-base text-white focus:border-[#ff4655] outline-none transition-colors font-mono tracking-wide"
                            maxLength={8}
                        />
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>ID: {profile?.custom_id || pendingId || '未分配'}</span>
                            <span>{nickname.length}/8 (仅限大写英文字母与数字)</span>
                        </div>
                    </div>

                    {/* Actions */}
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

                {/* 头像选择器覆盖层 */}
                {isAvatarPickerOpen && (
                    <div className="absolute inset-0 bg-[#181b1f] z-10 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#1c2028]">
                            <span className="text-sm font-bold text-white">选择特工头像</span>
                            <button onClick={() => setIsAvatarPickerOpen(false)} className="text-gray-400 hover:text-white">
                                <Icon name="X" size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-4 gap-3">
                                {AGENT_AVATARS.map((agent) => (
                                    <button
                                        key={agent}
                                        onClick={() => {
                                            setCurrentAvatar(agent);
                                            setIsAvatarPickerOpen(false);
                                        }}
                                        className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${currentAvatar === agent
                                            ? 'border-[#ff4655] scale-110 shadow-lg shadow-[#ff4655]/20'
                                            : 'border-white/10 hover:border-white/50 hover:scale-105'
                                            }`}
                                    >
                                        <img src={`/agents/${agent}`} alt={agent} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileModal;
