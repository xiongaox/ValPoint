/**
 * ImportLineupModal - 导入点位 Modal
 * 职责：处理点位 ZIP 包的批量选择、解析与导入。
 */

import React, { useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import Icon from './Icon';
import { useEscapeClose } from '../hooks/useEscapeClose';
import { importLineupFromZip, parseZipMetadata, ZipMetadata, ImportResult } from '../lib/lineupImport';
import { LineupDbPayload, BaseLineup } from '../types/lineup';

const MAX_FILES = 20;

type PendingFile = {
    file: File;
    metadata: ZipMetadata | null;
    error?: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    onImportSuccess: (payload: LineupDbPayload) => Promise<BaseLineup>;
    setAlertMessage: (msg: string) => void;
    fetchLineups: (userId: string) => void;
};

const ImportLineupModal: React.FC<Props> = ({
    isOpen,
    onClose,
    userId,
    onImportSuccess,
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

        const newPending: PendingFile[] = [];

        for (const file of files.slice(0, remaining)) {
            if (pendingFiles.some(p => p.file.name === file.name)) continue;

            try {
                const metadata = await parseZipMetadata(file);
                newPending.push({ file, metadata });
            } catch (error) {
                newPending.push({ file, metadata: null, error: '格式不规范' });
            }
        }

        setPendingFiles(prev => [...prev, ...newPending]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [pendingFiles, setAlertMessage]);

    const handleRemoveFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleClickSelect = () => fileInputRef.current?.click();

    const handleStartImport = useCallback(async () => {
        if (!userId) {
            setAlertMessage('请先登录');
            return;
        }

        const validFiles = pendingFiles.filter(p => !p.error);
        if (validFiles.length === 0) return;

        setIsImporting(true);
        setProgress({ current: 0, total: validFiles.length, status: '准备导入...' });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            const { file, metadata } = validFiles[i];
            setProgress({ current: i + 1, total: validFiles.length, status: `正在导入: ${metadata?.title || file.name}` });

            try {
                const result: ImportResult = await importLineupFromZip(file, userId);

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
        setAlertMessage(`导入完成！成功: ${successCount}${failCount > 0 ? `, 失败: ${failCount}` : ''}`);
        onClose();
    }, [userId, pendingFiles, onImportSuccess, fetchLineups, setAlertMessage, onClose]);

    const handleClose = () => {
        if (isImporting) return;
        setPendingFiles([]);
        setProgress(null);
        onClose();
    };

    useEscapeClose(isOpen, handleClose);

    if (!isOpen) return null;

    const validFilesCount = pendingFiles.filter(p => !p.error).length;

    return (
        <div
            className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-2xl bg-[#1c2028] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#ff4655]/10 border border-[#ff4655]/20 flex items-center justify-center text-[#ff4655]">
                            <Icon name="Download" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">批量导入点位 (ZIP)</h2>
                            <p className="text-sm text-gray-400">选择符合命名的 ZIP 点位包进行导入</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                    >
                        <Icon name="X" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Upload Area */}
                    <div
                        onClick={handleClickSelect}
                        className="group relative border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#ff4655]/30 transition-all cursor-pointer"
                    >
                        <input
                            type="file"
                            multiple
                            accept=".zip"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFilesSelect}
                        />
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-[#ff4655]/10 group-hover:text-[#ff4655] transition-colors">
                            <Icon name="Plus" size={32} />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold">点击或拖拽 ZIP 文件到此处</p>
                            <p className="text-sm text-gray-500 mt-1">支持批量选择，单次最多 {MAX_FILES} 个</p>
                        </div>
                    </div>

                    {/* Pending List */}
                    {pendingFiles.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">待导入列表 ({pendingFiles.length})</h3>
                                <button
                                    onClick={() => setPendingFiles([])}
                                    className="text-xs text-[#ff4655] hover:underline"
                                >
                                    清空全部
                                </button>
                            </div>
                            <div className="grid gap-2">
                                {pendingFiles.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Icon
                                                name={item.error ? "AlertCircle" : "FileCode"}
                                                size={18}
                                                className={item.error ? "text-amber-500" : "text-[#ff4655]"}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm text-white font-medium truncate">{item.file.name}</p>
                                                {item.error ? (
                                                    <p className="text-[11px] text-amber-500 uppercase font-bold">{item.error}</p>
                                                ) : (
                                                    <p className="text-[11px] text-emerald-500 uppercase font-bold">准备就绪</p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFile(idx)}
                                            className="p-1 text-gray-500 hover:text-white transition-colors"
                                        >
                                            <Icon name="Trash2" size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#1c2028]">
                    {progress ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">{progress.status}</span>
                                <span className="text-white font-bold">{Math.round((progress.current / progress.total) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#ff4655] transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                {validFilesCount > 0 ? `已选择 ${validFilesCount} 个有效点位` : '请先选择有效的点位包'}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2.5 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleStartImport}
                                    disabled={validFilesCount === 0 || isImporting}
                                    className="px-8 py-2.5 rounded-xl bg-[#ff4655] text-white font-bold hover:bg-[#ff4655]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#ff4655]/20 flex items-center gap-2"
                                >
                                    {isImporting && <Icon name="Loader" size={18} className="animate-spin" />}
                                    开始导入
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportLineupModal;
