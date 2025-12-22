import React, { useState, useRef, useCallback } from 'react';
import Icon from './Icon';
import { importLineupFromZip, ImportProgress, ImportResult } from '../lib/lineupImport';
import { ImageBedConfig } from '../types/imageBed';
import { LineupDbPayload, BaseLineup } from '../types/lineup';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    imageBedConfig: ImageBedConfig;
    userId: string | null;
    onImportSuccess: (payload: LineupDbPayload) => Promise<BaseLineup>;
    onOpenImageConfig: () => void;
    setAlertMessage: (msg: string) => void;
    fetchLineups: (userId: string) => void;
};

const ImportLineupModal: React.FC<Props> = ({
    isOpen,
    onClose,
    imageBedConfig,
    userId,
    onImportSuccess,
    onOpenImageConfig,
    setAlertMessage,
    fetchLineups,
}) => {
    const [progress, setProgress] = useState<ImportProgress | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!userId) {
                setAlertMessage('请先登录');
                return;
            }

            setIsImporting(true);
            setProgress({ status: 'reading', uploadedCount: 0, totalImages: 0 });

            try {
                const result: ImportResult = await importLineupFromZip(file, imageBedConfig, userId, setProgress);

                if (!result.success) {
                    setAlertMessage(result.errorMessage || '导入失败');
                    setProgress(null);
                    setIsImporting(false);
                    return;
                }

                if (result.payload) {
                    await onImportSuccess(result.payload);
                    fetchLineups(userId);

                    if (result.failedImages.length > 0) {
                        setAlertMessage(`导入成功，但有 ${result.failedImages.length} 张图片上传失败`);
                    } else {
                        setAlertMessage('导入成功');
                    }
                }

                setProgress(null);
                setIsImporting(false);
                onClose();
            } catch (error) {
                console.error('Import failed:', error);
                setAlertMessage('导入失败，请检查文件格式');
                setProgress(null);
                setIsImporting(false);
            }

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [imageBedConfig, userId, onImportSuccess, onClose, setAlertMessage, fetchLineups],
    );

    const handleClickSelect = () => {
        fileInputRef.current?.click();
    };

    if (!isOpen) return null;

    const isConfigured = imageBedConfig?.provider && (
        (imageBedConfig.provider === 'aliyun' && imageBedConfig.accessKeyId && imageBedConfig.accessKeySecret) ||
        (imageBedConfig.provider === 'tencent' && imageBedConfig.secretId && imageBedConfig.secretKey) ||
        (imageBedConfig.provider === 'qiniu' && imageBedConfig.accessKey && imageBedConfig.accessKeySecret)
    );

    return (
        <div className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181b1f]/95 shadow-2xl shadow-black/50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/35 flex items-center justify-center text-[#ff4655]">
                            <Icon name="Download" size={18} />
                        </div>
                        <div className="leading-tight">
                            <div className="text-xl font-bold text-white">导入点位</div>
                            <div className="text-xs text-gray-500">从共享库导出的 ZIP 包导入</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isImporting}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                        aria-label="关闭"
                    >
                        <Icon name="X" size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 bg-[#181b1f]">
                    {!isConfigured ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                <Icon name="AlertTriangle" size={32} className="text-amber-400" />
                            </div>
                            <p className="text-white font-semibold mb-2">未配置图床</p>
                            <p className="text-gray-400 text-sm mb-4">导入点位需要将图片上传至图床，请先完成配置</p>
                            <button
                                onClick={() => { onOpenImageConfig(); onClose(); }}
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
                                {progress?.status === 'reading' && '正在读取文件...'}
                                {progress?.status === 'uploading' && `正在上传图片 (${progress.uploadedCount + 1}/${progress.totalImages})`}
                                {progress?.status === 'done' && '导入完成'}
                            </p>
                            {progress?.currentImage && (
                                <p className="text-gray-400 text-sm">{progress.currentImage}</p>
                            )}
                        </div>
                    ) : (
                        <div className="py-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".zip"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div
                                onClick={handleClickSelect}
                                className="border-2 border-dashed border-white/10 rounded-xl p-8 cursor-pointer hover:border-[#ff4655]/50 hover:bg-[#ff4655]/5 transition-all group"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 group-hover:bg-[#ff4655]/10 group-hover:border-[#ff4655]/30 flex items-center justify-center transition-colors">
                                    <Icon name="Upload" size={32} className="text-gray-500 group-hover:text-[#ff4655] transition-colors" />
                                </div>
                                <p className="text-white font-semibold mb-1 text-center">点击选择 ZIP 文件</p>
                                <p className="text-gray-500 text-xs text-center">支持从共享库导出的点位包</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">提示：导入后图片会上传至您配置的图床</div>
                        <button
                            onClick={onClose}
                            disabled={isImporting}
                            className="px-4 py-2 rounded-lg border border-white/15 text-sm text-gray-200 hover:border-white/40 hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportLineupModal;
