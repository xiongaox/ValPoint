import React, { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import AlertModal from '../../components/AlertModal';
import { getUserSubmissions, deleteSubmission, cancelSubmission, deleteSubmissionsByStatus } from '../../lib/submissionUpload';
import { LineupSubmission, SubmissionStatus } from '../../types/submission';
import { MAP_TRANSLATIONS } from '../../constants/maps';

interface Props {
    userId: string | null;
}

/** 状态配置 */
const STATUS_CONFIG: Record<SubmissionStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
    pending: {
        label: '待审核',
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/10',
        borderColor: 'border-amber-400/20',
        icon: 'Clock',
    },
    approved: {
        label: '已通过',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-400/10',
        borderColor: 'border-emerald-400/20',
        icon: 'CheckCircle2',
    },
    rejected: {
        label: '已拒绝',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/20',
        icon: 'XCircle',
    },
};

const PendingSubmissionsTab: React.FC<Props> = ({ userId }) => {
    const [submissions, setSubmissions] = useState<LineupSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<{
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const loadSubmissions = async () => {
        if (!userId) {
            setSubmissions([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const data = await getUserSubmissions(userId);
        setSubmissions(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadSubmissions();
    }, [userId]);

    const handleCancel = async (id: string) => {
        if (!userId) return;
        setIsDeleting(id);
        const result = await cancelSubmission(id, userId);
        if (!result.success) alert(result.error);
        await loadSubmissions();
        setIsDeleting(null);
    };

    const handleDelete = async (id: string) => {
        if (!userId) return;
        setConfirmState({
            message: '确定要删除这条记录吗？',
            onConfirm: async () => {
                setConfirmState(null);
                setIsDeleting(id);
                const result = await deleteSubmission(id, userId);
                if (!result.success) setAlertMessage(result.error || '删除失败');
                await loadSubmissions();
                setIsDeleting(null);
            }
        });
    };

    const handleBatchDelete = async (filter: 'all' | 'approved' | 'rejected') => {
        if (!userId) return;
        const labels = { all: '所有已审核的', approved: '所有已通过的', rejected: '所有已拒绝的' };
        setConfirmState({
            message: `确定要删除${labels[filter]}投稿吗？审核中的不会被删除。`,
            onConfirm: async () => {
                setConfirmState(null);
                setShowDeleteMenu(false);
                setIsLoading(true);
                const result = await deleteSubmissionsByStatus(userId, filter);
                if (!result.success) {
                    setAlertMessage(result.error || '删除失败');
                } else {
                    setAlertMessage(`已删除 ${result.deletedCount} 条记录`);
                }
                await loadSubmissions();
            }
        });
    };

    if (!userId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Icon name="Lock" size={32} className="text-gray-500" />
                </div>
                <p className="text-white font-bold mb-1">请先登录</p>
                <p className="text-gray-500 text-sm">登录后即可查看您的投稿记录</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-[#ff4655]">
                <Icon name="Loader2" size={32} className="animate-spin" />
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Icon name="Inbox" size={32} className="text-gray-600" />
                </div>
                <p className="text-white font-bold mb-1">暂无投稿记录</p>
                <p className="text-gray-500 text-sm text-center">点击「投稿点位」分享您的第一个点位</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1923]/50">
                {/* Header */}
                <div className="relative z-50 px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#1f2326]/30 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ff4655]" />
                        <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">我的投稿 ({submissions.length})</span>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs font-bold hover:bg-white/5 hover:text-white transition-all active:scale-95"
                        >
                            <Icon name="Settings2" size={14} />
                            清理记录
                        </button>
                        {showDeleteMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowDeleteMenu(false)} />
                                <div className="absolute top-full right-0 mt-2 w-44 bg-[#1f2326] border border-white/10 rounded-xl shadow-2xl z-[9999] overflow-hidden py-1">
                                    <button
                                        onClick={() => handleBatchDelete('all')}
                                        className="w-full px-4 py-2.5 text-left text-xs text-white hover:bg-[#ff4655]/10 hover:text-[#ff4655] transition-colors flex items-center gap-2"
                                    >
                                        <Icon name="Trash2" size={12} /> 全部已审核
                                    </button>
                                    <button
                                        onClick={() => handleBatchDelete('approved')}
                                        className="w-full px-4 py-2.5 text-left text-xs text-emerald-400 hover:bg-emerald-400/10 transition-colors flex items-center gap-2"
                                    >
                                        <Icon name="CheckCircle2" size={12} /> 已通过记录
                                    </button>
                                    <button
                                        onClick={() => handleBatchDelete('rejected')}
                                        className="w-full px-4 py-2.5 text-left text-xs text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-2"
                                    >
                                        <Icon name="XCircle" size={12} /> 已拒绝记录
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {submissions.map((item) => {
                        const statusConfig = STATUS_CONFIG[item.status];
                        const isProcessing = isDeleting === item.id;
                        const mapDisplayName = MAP_TRANSLATIONS[item.map_name] || item.map_name;

                        return (
                            <div
                                key={item.id}
                                className="group relative bg-[#1f2326]/40 border border-white/5 rounded-xl p-4 transition-all duration-300 hover:border-[#ff4655]/30 hover:bg-[#1f2326]/60 shadow-lg"
                            >
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4">
                                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold tracking-tight border ${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                                        <Icon name={statusConfig.icon as any} size={12} />
                                        {statusConfig.label}
                                    </span>
                                </div>

                                <div className="flex gap-3 pr-20">
                                    {/* Agent Icon */}
                                    {item.agent_icon && (
                                        <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                                            <img src={item.agent_icon} alt={item.agent_name} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                                        {/* Title */}
                                        <h4 className="text-base font-bold text-white group-hover:text-[#ff4655] transition-colors truncate">
                                            {item.title}
                                        </h4>

                                        {/* Info Row */}
                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-2">
                                            <div className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-md">
                                                <Icon name="Map" size={12} className="text-[#ff4655]" />
                                                <span>{mapDisplayName}</span>
                                            </div>
                                            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/5 ${item.side === 'attack' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.side === 'attack' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                                                <span>{item.side === 'attack' ? '进攻方' : '防守方'}</span>
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Icon name="Calendar" size={12} />
                                            <span>投稿于 {new Date(item.created_at).toLocaleString('zh-CN', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Rejected Reason */}
                                {item.status === 'rejected' && item.reject_reason && (
                                    <div className="mt-4 p-3 rounded-lg bg-red-400/5 border border-red-400/10 flex gap-2">
                                        <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0 mt-0.5" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-red-400">拒绝原因</span>
                                            <p className="text-xs text-gray-400 leading-relaxed">{item.reject_reason}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                                    {item.status === 'pending' ? (
                                        <button
                                            onClick={() => handleCancel(item.id)}
                                            disabled={isProcessing}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-amber-400 bg-amber-400/5 border border-amber-400/20 hover:bg-amber-400/10 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Icon name="Ban" size={14} />
                                            {isProcessing ? '处理中...' : '撤回投稿'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={isProcessing}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-gray-400 bg-white/5 border border-white/10 hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/20 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Icon name="Trash2" size={14} />
                                            {isProcessing ? '删除中...' : '删除记录'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 确认弹窗 */}
            <AlertModal
                message={confirmState?.message ?? null}
                onClose={() => setConfirmState(null)}
                actionLabel="取消"
                secondaryLabel="确定"
                onSecondary={confirmState?.onConfirm}
            />

            {/* 消息弹窗 */}
            <AlertModal
                message={alertMessage}
                onClose={() => setAlertMessage(null)}
            />
        </>
    );
};

export default PendingSubmissionsTab;
