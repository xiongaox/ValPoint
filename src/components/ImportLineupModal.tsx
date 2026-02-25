/**
 * ImportLineupModal - 组件层
 *
 * 模块定位：
 * - 所在层级：组件层
 * - 主要目标：承载界面渲染与事件分发
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:ImportLineupModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`./Icon`、`../lib/lineupImport`、`../types/imageBed`
 * - 下游影响：供页面与应用壳组合
 */

import React, { useState, useRef, useCallback } from 'react';
import Icon from './Icon';
import { importLineupFromZip, ImportProgress, ImportResult, parseZipMetadata, ZipMetadata } from '../lib/lineupImport';
import { ImageBedConfig } from '../types/imageBed';
import { LineupDbPayload, BaseLineup } from '../types/lineup';
import { useEscapeClose } from '../hooks/useEscapeClose';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    imageBedConfig: ImageBedConfig;
    userId: string | null;
    lineups: BaseLineup[];
    onImportSuccess: (payload: LineupDbPayload) => Promise<BaseLineup>;
    onOpenImageConfig: () => void;
    setAlertMessage: (msg: string) => void;
    fetchLineups: (userId: string) => void;
};

const MAX_FILES = 10;

type PendingFile = {
    file: File;
    metadata: ZipMetadata | null;
    error?: string;
};

const ImportLineupModal: React.FC<Props> = ({
    isOpen,
    onClose,
    imageBedConfig,
    userId,
    lineups,
    onImportSuccess,
    onOpenImageConfig,
    setAlertMessage,
    fetchLineups,
}) => {
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [progress, setProgress] = useState<{ current: number; total: number; status: string } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            if (pendingFiles.some(p => p.file.name === file.name)) continue;

            try {
                const metadata = await parseZipMetadata(file);
                newPending.push({ file, metadata });
            } catch (error) {
                newPending.push({ file, metadata: null, error: '无法解析文件' });
            }
        }

        setPendingFiles(prev => [...prev, ...newPending]);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [pendingFiles, setAlertMessage]);

    const handleRemoveFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleClickSelect = () => {
        fileInputRef.current?.click();
    };

    const handleStartImport = useCallback(async () => {
        if (!userId) {
            setAlertMessage('请先登录');
            return;
        }

        const validFiles = pendingFiles.filter(p => p.metadata && !p.error);
        if (validFiles.length === 0) {
            setAlertMessage('没有可导入的文件');
            return;
        }

        setIsImporting(true);
        setProgress({ current: 0, total: validFiles.length, status: '准备导入...' });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            const { file, metadata } = validFiles[i];
            setProgress({ current: i + 1, total: validFiles.length, status: `正在导入: ${metadata?.title || file.name}` });

            try {
                const result: ImportResult = await importLineupFromZip(file, imageBedConfig, userId, lineups);

                if (result.success && result.payload) {
                    await onImportSuccess(result.payload);
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                console.error('Import failed:', error);
                failCount++;
            }
        }

        fetchLineups(userId);
        setIsImporting(false);
        setProgress(null);
        setPendingFiles([]);

        if (failCount === 0) {
            setAlertMessage(`成功导入 ${successCount} 个点位`);
        } else {
            setAlertMessage(`成功 ${successCount} 个，失败 ${failCount} 个`);
        }

        onClose();
    }, [userId, pendingFiles, imageBedConfig, onImportSuccess, fetchLineups, setAlertMessage, onClose]);

    const handleClose = () => {
        if (isImporting) return;
        setPendingFiles([]);
        setProgress(null);
        onClose();
    };

    useEscapeClose(isOpen, handleClose);

    if (!isOpen) return null;

    const isConfigured = imageBedConfig?.provider && (
        (imageBedConfig.provider === 'aliyun' && imageBedConfig.accessKeyId && imageBedConfig.accessKeySecret) ||
        (imageBedConfig.provider === 'tencent' && imageBedConfig.secretId && imageBedConfig.secretKey) ||
        (imageBedConfig.provider === 'qiniu' && imageBedConfig.accessKey && imageBedConfig.accessKeySecret)
    );

    const validFilesCount = pendingFiles.filter(p => p.metadata && !p.error).length;

    return (
        <div
            className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
                            <Icon name="Download" size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xl font-bold text-white">导入点位</div>
                            <div className="text-xs text-gray-500">支持批量导入，最多 {MAX_FILES} 个</div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isImporting}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                        aria-label="关闭"
                    >
                        <Icon name="X" size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-4 bg-[#181b1f] max-h-[60vh] overflow-y-auto">
                    {!isConfigured ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                <Icon name="AlertTriangle" size={32} className="text-amber-400" />
                            </div>
                            <p className="text-white font-semibold mb-2">未配置图床</p>
                            <p className="text-gray-400 text-sm mb-4">导入点位需要将图片上传至图床，请先完成配置</p>
                            <button
                                onClick={() => { onOpenImageConfig(); handleClose(); }}
                                className="px-5 py-2 rounded-lg bg-[#ff4655] hover:bg-[#d93a49] text-white font-semibold text-sm transition-colors flex items-center gap-2 mx-auto shadow-md shadow-red-900/30"
                            >
                                <Icon name="Settings" size={16} />
                                配置图床
                            </button>
                        </div>
                    ) : isImporting ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff4655]/10 border border-[#ff4655]/30 flex items-center justify-center animate-pulse">
                                <Icon name="Loader" size={32} className="text-[#ff4655] animate-spin" />
                            </div>
                            <p className="text-white font-semibold mb-2">
                                正在导入 ({progress?.current}/{progress?.total})
                            </p>
                            <p className="text-gray-400 text-sm">{progress?.status}</p>
                        </div>
                    ) : (
                        <>
                            {pendingFiles.length > 0 && (
                                <div className="space-y-2">
                                    {pendingFiles.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-3 p-3 rounded-lg border ${item.error ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/5'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                <Icon name={item.error ? 'AlertCircle' : 'FileArchive'} size={16} className={item.error ? 'text-red-400' : 'text-gray-400'} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">{item.metadata?.title || item.file.name}</p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {item.error || (item.metadata ? `${item.metadata.mapName} · ${item.metadata.agentName}` : item.file.name)}
                                                </p>
                                            </div>
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
                                        className={`border-2 border-dashed rounded-xl cursor-pointer hover:border-[#ff4655]/50 hover:bg-[#ff4655]/5 transition-all group ${pendingFiles.length > 0 ? 'border-white/5 p-4' : 'border-white/10 p-8'
                                            }`}
                                    >
                                        <div className={`flex items-center justify-center gap-3 ${pendingFiles.length > 0 ? '' : 'flex-col'}`}>
                                            <div className={`rounded-full bg-white/5 border border-white/10 group-hover:bg-[#ff4655]/10 group-hover:border-[#ff4655]/30 flex items-center justify-center transition-colors ${pendingFiles.length > 0 ? 'w-10 h-10' : 'w-16 h-16 mb-2'
                                                }`}>
                                                <Icon name="Plus" size={pendingFiles.length > 0 ? 20 : 32} className="text-gray-500 group-hover:text-[#ff4655] transition-colors" />
                                            </div>
                                            <div className={pendingFiles.length > 0 ? '' : 'text-center'}>
                                                <p className="text-white font-semibold text-sm">
                                                    {pendingFiles.length > 0 ? '添加更多文件' : '点击选择 ZIP 文件'}
                                                </p>
                                                {pendingFiles.length === 0 && (
                                                    <p className="text-gray-500 text-xs mt-1">支持批量选择，最多 {MAX_FILES} 个</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="px-5 py-4 border-t border-white/10 bg-[#1c2028] flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        {pendingFiles.length > 0 ? `已选择 ${validFilesCount} 个有效文件` : '提示：导入后图片会上传至您配置的图床'}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleClose}
                            disabled={isImporting}
                            className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            取消
                        </button>
                        {pendingFiles.length > 0 && isConfigured && (
                            <button
                                onClick={handleStartImport}
                                disabled={isImporting || validFilesCount === 0}
                                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-md shadow-emerald-900/30 disabled:opacity-50"
                            >
                                <Icon name="Upload" size={16} />
                                开始导入 ({validFilesCount})
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportLineupModal;
