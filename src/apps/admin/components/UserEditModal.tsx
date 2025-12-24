import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Icon from '../../../components/Icon';
import { updateAvatarCache } from '../../../components/UserAvatar';

// 头像列表（与 UserProfileModal 保持一致）
const AGENT_AVATARS = [
    'KO.png', '不死鸟.png', '壹决.png', '夜露.png', '奇乐.png',
    '尚勃勒.png', '幻棱.png', '幽影.png', '捷风.png', '斯凯.png',
    '星礈.png', '暮蝶.png', '海神.png', '炼狱.png', '猎枭.png',
    '盖可.png', '禁灭.png', '维斯.png', '芮娜.png', '蝰蛇.png',
    '贤者.png', '钛狐.png', '钢锁.png', '铁臂.png', '零.png',
    '雷兹.png', '霓虹.png', '黑梦.png'
];

export interface UserProfile {
    id: string;
    email: string;
    nickname: string | null;
    avatar: string | null;
    custom_id: string | null;
    is_banned: boolean;
    ban_reason: string | null;
    download_count: number;
    created_at: string;
    updated_at: string;
}

interface UserEditModalProps {
    isOpen: boolean;
    user: UserProfile | null;
    onClose: () => void;
    onSave: (userId: string, data: Partial<UserProfile>) => Promise<void>;
    isSubmitting: boolean;
}

/**
 * 用户编辑弹窗
 */
function UserEditModal({ isOpen, user, onClose, onSave, isSubmitting }: UserEditModalProps) {
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState('');
    const [isBanned, setIsBanned] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    // 初始化表单数据
    useEffect(() => {
        if (user) {
            setNickname(user.nickname || '');
            setAvatar(user.avatar || '捷风.png');
            setIsBanned(user.is_banned);
            setBanReason(user.ban_reason || '');
            setIsAvatarPickerOpen(false);
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(user.id, {
            nickname,
            avatar,
            is_banned: isBanned,
            ban_reason: isBanned ? banReason : null,
        });
        // 更新头像缓存，确保所有组件立即显示新头像
        updateAvatarCache(user.email, avatar);
    };

    // 禁用/解禁用户
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
                {/* Header */}
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

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5 bg-[#181b1f]">
                    {/* 头像设置 - 放在最上面 */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAvatarPickerOpen(true)}
                            className="relative w-20 h-20 rounded-full border-2 border-white/10 overflow-hidden bg-[#0f131a] group hover:border-[#ff4655] transition-colors cursor-pointer"
                            title="点击更换头像"
                        >
                            <img
                                src={`/agents/${avatar}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Icon name="Camera" size={20} className="text-white" />
                            </div>
                        </button>
                        <span className="text-xs text-gray-500">点击头像更换</span>
                    </div>

                    {/* 昵称 */}
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

                    {/* 用户基本信息 - 紧跟昵称后面 */}
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

                    {/* 账户状态文案 */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">账户状态</span>
                        <span className={isBanned ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
                            {isBanned ? '已禁用' : '正常'}
                        </span>
                    </div>

                    {/* 禁用原因输入框（仅禁用时显示） */}
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

                    {/* 按钮 - 禁用按钮放在取消旁边 */}
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
                                {AGENT_AVATARS.map((agentAvatar) => (
                                    <button
                                        key={agentAvatar}
                                        type="button"
                                        onClick={() => {
                                            setAvatar(agentAvatar);
                                            setIsAvatarPickerOpen(false);
                                        }}
                                        className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${avatar === agentAvatar
                                            ? 'border-[#ff4655] scale-110 shadow-lg shadow-[#ff4655]/20'
                                            : 'border-white/10 hover:border-white/50 hover:scale-105'
                                            }`}
                                    >
                                        <img src={`/agents/${agentAvatar}`} alt={agentAvatar} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

export default UserEditModal;
