/**
 * SubmitLineupModal - 在线投稿弹窗
 * 
 * 职责：
 * - 提供点位投稿表单，指引用户上传 ZIP 包或补充元数据
 * - 查询当前用户的日投稿限额
 * - 调用 submissionUpload 服务完成数据上传
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '../../components/Icon';
import { parseSubmissionZip, submitLineup, checkDailySubmissionLimit } from '../../lib/submissionUpload';
import { SubmissionProgress } from '../../types/submission';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    userEmail?: string;
    onSuccess?: () => void;
    setAlertMessage: (msg: string) => void;
};

/** ZIP 预解析的元数据 */
interface ParsedMetadata {
    title: string;
    mapName: string;
    agentName: string;
    side: 'attack' | 'defense';
    imageCount: number;
}

/** 待提交的文件 */
interface PendingFile {
    file: File;
    metadata: ParsedMetadata | null;
    error?: string;
}

const MAX_FILES = 10;

const SubmitLineupModal: React.FC<Props> = ({
    isOpen,
    onClose,
    userId,
    userEmail,
    onSuccess,
    setAlertMessage,
}) => {
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [progress, setProgress] = useState<{ current: number; total: number; status: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 检查剩余投稿额度
    useEffect(() => {
        if (isOpen && userId) {
            checkDailySubmissionLimit(userId).then(({ remaining }) => {
                setRemainingQuota(remaining);
            });
        }
    }, [isOpen, userId]);

    // 处理文件选择
    const handleFilesSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remaining = MAX_FILES - pendingFiles.length;
        if (remaining <= 0) {
            setAlertMessage(`最多只能添加 ${MAX_FILES} 个文件`);
            return;
        }

        const toAdd = files.slice(0, remaining);
        const newPending: PendingFile[] = [];

        for (const file of toAdd) {
            // 跳过重复文件
            if (pendingFiles.some(p => p.file.name === file.name)) continue;

            try {
                const { jsonPayload, images } = await parseSubmissionZip(file);
                newPending.push({
                    file,
                    metadata: {
                        title: jsonPayload.title || '未命名点位',
                        mapName: jsonPayload.map_name,
                        agentName: jsonPayload.agent_name,
                        side: jsonPayload.side || 'attack',
                        imageCount: images.size,
                    },
                });
            } catch (error) {
                newPending.push({ file, metadata: null, error: '无法解析文件' });
            }
        }

        setPendingFiles(prev => [...prev, ...newPending]);

        // 重置 input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [pendingFiles, setAlertMessage]);

    // 移除单个文件
    const handleRemoveFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    // 点击选择文件
    const handleClickSelect = () => {
        fileInputRef.current?.click();
    };

    // 开始投稿
    const handleStartSubmit = useCallback(async () => {
        if (!userId) {
            setAlertMessage('请先登录');
            return;
        }

        const validFiles = pendingFiles.filter(p => p.metadata && !p.error);
        if (validFiles.length === 0) {
            setAlertMessage('没有可投稿的文件');
            return;
        }

        if (remainingQuota !== null && validFiles.length > remainingQuota) {
            setAlertMessage(`今日剩余投稿额度不足（剩余 ${remainingQuota} 个）`);
            return;
        }

        setIsSubmitting(true);
        setProgress({ current: 0, total: validFiles.length, status: '准备投稿...' });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            const { file, metadata } = validFiles[i];
            setProgress({
                current: i + 1,
                total: validFiles.length,
                status: `正在投稿: ${metadata?.title || file.name}`,
            });

            const result = await submitLineup(
                file,
                userId,
                userEmail,
                (p: SubmissionProgress) => {
                    // 可扩展单个文件的详细进度
                },
            );

            if (result.success) {
                successCount++;
            } else {
                failCount++;
                console.error('投稿失败:', result.errorMessage);
            }
        }

        setIsSubmitting(false);
        setProgress(null);
        setPendingFiles([]);

        if (failCount === 0) {
            setAlertMessage(`成功投稿 ${successCount} 个点位，请等待审核`);
        } else {
            setAlertMessage(`成功 ${successCount} 个，失败 ${failCount} 个`);
        }

        onSuccess?.();
        onClose();
    }, [userId, userEmail, pendingFiles, remainingQuota, setAlertMessage, onSuccess, onClose]);

    // 关闭弹窗
    const handleClose = () => {
        if (isSubmitting) return;
        setPendingFiles([]);
        setProgress(null);
        onClose();
    };

    if (!isOpen) return null;

    const validFilesCount = pendingFiles.filter(p => p.metadata && !p.error).length;

    return (
        <div className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                            <Icon name="Send" size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xl font-bold text-white">投稿点位</div>
                            <div className="text-xs text-gray-500">
                                {remainingQuota !== null
                                    ? `今日剩余 ${remainingQuota} 次投稿机会`
                                    : '支持批量投稿，最多 10 个'
                                }
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                        aria-label="关闭"
                    >
                        <Icon name="X" size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 bg-[#181b1f] max-h-[60vh] overflow-y-auto">
                    {!userId ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                <Icon name="AlertTriangle" size={32} className="text-amber-400" />
                            </div>
                            <p className="text-white font-semibold mb-2">请先登录</p>
                            <p className="text-gray-400 text-sm">登录后即可投稿点位</p>
                        </div>
                    ) : remainingQuota === 0 ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                <Icon name="AlertCircle" size={32} className="text-red-400" />
                            </div>
                            <p className="text-white font-semibold mb-2">今日投稿次数已达上限</p>
                            <p className="text-gray-400 text-sm">请明天再来投稿</p>
                        </div>
                    ) : isSubmitting ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse">
                                <Icon name="Loader" size={32} className="text-emerald-400 animate-spin" />
                            </div>
                            <p className="text-white font-semibold mb-2">
                                正在投稿 ({progress?.current}/{progress?.total})
                            </p>
                            <p className="text-gray-400 text-sm">{progress?.status}</p>
                        </div>
                    ) : (
                        <>
                            {/* 待投稿文件列表 */}
                            {pendingFiles.length > 0 && (
                                <div className="space-y-2">
                                    {pendingFiles.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-3 p-3 rounded-lg border ${item.error ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/5'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                <Icon
                                                    name={item.error ? 'AlertCircle' : 'FileArchive'}
                                                    size={16}
                                                    className={item.error ? 'text-red-400' : 'text-gray-400'}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">
                                                    {item.metadata?.title || item.file.name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {item.error ||
                                                        (item.metadata
                                                            ? `${item.metadata.mapName} · ${item.metadata.agentName} · ${item.metadata.imageCount} 张图片`
                                                            : item.file.name)}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${item.metadata?.side === 'attack'
                                                    ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                                    : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                                    }`}
                                            >
                                                {item.metadata?.side === 'attack' ? '进攻' : '防守'}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveFile(index)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Icon name="X" size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 添加文件区域 */}
                            {pendingFiles.length < MAX_FILES && (
                                <div className="py-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".zip"
                                        multiple
                                        onChange={handleFilesSelect}
                                        className="hidden"
                                    />
                                    <div
                                        onClick={handleClickSelect}
                                        className={`border-2 border-dashed rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group ${pendingFiles.length > 0 ? 'border-white/5 p-4' : 'border-white/10 p-8'
                                            }`}
                                    >
                                        <div className={`flex items-center justify-center gap-3 ${pendingFiles.length > 0 ? '' : 'flex-col'}`}>
                                            <div
                                                className={`rounded-full bg-white/5 border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 flex items-center justify-center transition-colors ${pendingFiles.length > 0 ? 'w-10 h-10' : 'w-16 h-16 mb-2'
                                                    }`}
                                            >
                                                <Icon
                                                    name="Plus"
                                                    size={pendingFiles.length > 0 ? 20 : 32}
                                                    className="text-gray-500 group-hover:text-emerald-400 transition-colors"
                                                />
                                            </div>
                                            <div className={pendingFiles.length > 0 ? '' : 'text-center'}>
                                                <p className="text-white font-semibold text-sm">
                                                    {pendingFiles.length > 0 ? '添加更多文件' : '点击选择 ZIP 文件'}
                                                </p>
                                                {pendingFiles.length === 0 && (
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        支持批量选择，最多 {MAX_FILES} 个
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/10 bg-[#1c2028] flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        {pendingFiles.length > 0
                            ? `已选择 ${validFilesCount} 个有效文件`
                            : '提示：点位将上传至共享库等待审核'}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            取消
                        </button>
                        {pendingFiles.length > 0 && userId && remainingQuota !== 0 && (
                            <button
                                onClick={handleStartSubmit}
                                disabled={isSubmitting || validFilesCount === 0}
                                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-md shadow-emerald-900/30 disabled:opacity-50"
                            >
                                <Icon name="Send" size={16} />
                                投稿 ({validFilesCount})
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmitLineupModal;
