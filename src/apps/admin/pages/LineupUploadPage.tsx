/**
 * 管理员点位上传页面
 * 复用投稿界面 UI，直接上传到共享库（无需审核）
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '../../../components/Icon';
import { parseZipMetadata, adminUploadLineup, AdminUploadProgress } from '../../../lib/adminUpload';
import { useEmailAuth } from '../../../hooks/useEmailAuth';
import { supabase } from '../../../supabaseClient';
import { ImageBedConfig } from '../../../types/imageBed';

// 系统设置表的固定 ID
const SYSTEM_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

/** ZIP 预解析的元数据 */
interface ParsedMetadata {
    title: string;
    mapName: string;
    agentName: string;
    side: 'attack' | 'defense';
    imageCount: number;
}

/** 待上传的文件 */
interface PendingFile {
    file: File;
    metadata: ParsedMetadata | null;
    error?: string;
    status?: 'pending' | 'uploading' | 'done' | 'failed';
}

const MAX_FILES = 20;

interface Props {
    setAlertMessage: (msg: string | null) => void;
}

function LineupUploadPage({ setAlertMessage }: Props) {
    const { user } = useEmailAuth();
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [progress, setProgress] = useState<{ current: number; total: number; status: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [ossConfig, setOssConfig] = useState<ImageBedConfig | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 获取 OSS 配置
    useEffect(() => {
        const fetchOssConfig = async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('official_oss_config')
                .eq('id', SYSTEM_SETTINGS_ID)
                .single();

            if (data?.official_oss_config) {
                setOssConfig(data.official_oss_config);
            }
        };
        fetchOssConfig();
    }, []);

    // 处理文件添加（内部）
    const addFiles = useCallback(async (files: File[]) => {
        if (files.length === 0) return;

        const remaining = MAX_FILES - pendingFiles.length;
        if (remaining <= 0) {
            setAlertMessage(`最多只能添加 ${MAX_FILES} 个文件`);
            return;
        }

        const toAdd = files.filter(f => f.name.endsWith('.zip')).slice(0, remaining);
        const newPending: PendingFile[] = [];

        for (const file of toAdd) {
            // 跳过重复文件
            if (pendingFiles.some(p => p.file.name === file.name)) continue;

            const metadata = await parseZipMetadata(file);
            if (metadata) {
                newPending.push({ file, metadata, status: 'pending' });
            } else {
                newPending.push({ file, metadata: null, error: '无法解析文件', status: 'pending' });
            }
        }

        setPendingFiles(prev => [...prev, ...newPending]);
    }, [pendingFiles, setAlertMessage]);

    // 处理文件选择
    const handleFilesSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        await addFiles(files);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [addFiles]);

    // 拖拽处理
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        await addFiles(files);
    };

    // 移除单个文件
    const handleRemoveFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    // 清空所有文件
    const handleClearAll = () => {
        setPendingFiles([]);
    };

    // 点击选择文件
    const handleClickSelect = () => {
        fileInputRef.current?.click();
    };

    // 开始上传
    const handleStartUpload = useCallback(async () => {
        if (!ossConfig) {
            setAlertMessage('请先配置图床');
            return;
        }

        const validFiles = pendingFiles.filter(p => p.metadata && !p.error);
        if (validFiles.length === 0) {
            setAlertMessage('没有可上传的文件');
            return;
        }

        setIsUploading(true);
        setProgress({ current: 0, total: validFiles.length, status: '准备上传...' });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            const { file, metadata } = validFiles[i];

            // 更新文件状态为上传中
            setPendingFiles(prev => prev.map((p, idx) =>
                prev.indexOf(validFiles[i]) === idx ? { ...p, status: 'uploading' as const } : p
            ));

            setProgress({
                current: i + 1,
                total: validFiles.length,
                status: `正在上传: ${metadata?.title || file.name}`,
            });

            const result = await adminUploadLineup(
                file,
                user?.email || 'admin',
                ossConfig,
                (p: AdminUploadProgress) => {
                    // 可扩展单个文件的详细进度
                },
            );

            if (result.success) {
                successCount++;
                // 从列表中移除成功的文件
                setPendingFiles(prev => prev.filter(p => p.file !== file));
            } else {
                failCount++;
                // 标记为失败
                setPendingFiles(prev => prev.map(p =>
                    p.file === file ? { ...p, status: 'failed' as const, error: result.errorMessage } : p
                ));
            }
        }

        setIsUploading(false);
        setProgress(null);

        if (failCount === 0) {
            setAlertMessage(`成功上传 ${successCount} 个点位到共享库`);
        } else {
            setAlertMessage(`成功 ${successCount} 个，失败 ${failCount} 个`);
        }
    }, [ossConfig, pendingFiles, user, setAlertMessage]);

    const validFilesCount = pendingFiles.filter(p => p.metadata && !p.error).length;

    return (
        <div className="space-y-6">
            {/* 上传说明 */}
            <div className="bg-[#1f2326] rounded-xl border border-white/10 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center justify-center shrink-0">
                        <Icon name="Upload" size={24} className="text-[#ff4655]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">管理员上传</h3>
                        <p className="text-sm text-gray-400">
                            上传点位将<span className="text-emerald-400 font-medium">直接发布</span>到共享库，无需审核
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            文件格式：ZIP 格式的点位数据包，包含 JSON 元数据和图片
                        </p>
                    </div>
                </div>
            </div>

            {/* OSS 配置提示 */}
            {!ossConfig && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
                    <Icon name="AlertTriangle" size={20} className="text-amber-400 shrink-0" />
                    <div>
                        <p className="text-amber-200 text-sm font-medium">未配置图床</p>
                        <p className="text-amber-400/70 text-xs">请先在「系统设置」中配置图床后再上传</p>
                    </div>
                </div>
            )}

            {/* 上传区域 */}
            <div className="bg-[#1f2326] rounded-xl border border-white/10 overflow-hidden">
                {/* 待上传文件列表 */}
                {pendingFiles.length > 0 && (
                    <div className="p-4 space-y-2 border-b border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-400">
                                已选择 {pendingFiles.length} 个文件（{validFilesCount} 个有效）
                            </span>
                            <button
                                onClick={handleClearAll}
                                disabled={isUploading}
                                className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                                清空全部
                            </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {pendingFiles.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${item.error
                                        ? 'border-red-500/30 bg-red-500/5'
                                        : item.status === 'uploading'
                                            ? 'border-amber-500/30 bg-amber-500/5'
                                            : 'border-white/10 bg-white/5'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        {item.status === 'uploading' ? (
                                            <Icon name="Loader" size={16} className="text-amber-400 animate-spin" />
                                        ) : (
                                            <Icon
                                                name={item.error ? 'AlertCircle' : 'FileArchive'}
                                                size={16}
                                                className={item.error ? 'text-red-400' : 'text-gray-400'}
                                            />
                                        )}
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
                                    {item.metadata && (
                                        <span
                                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${item.metadata.side === 'attack'
                                                ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                                : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                                }`}
                                        >
                                            {item.metadata.side === 'attack' ? '进攻' : '防守'}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleRemoveFile(index)}
                                        disabled={isUploading}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    >
                                        <Icon name="X" size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 添加文件区域 */}
                {pendingFiles.length < MAX_FILES && (
                    <div className="p-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip"
                            multiple
                            onChange={handleFilesSelect}
                            className="hidden"
                        />
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleClickSelect}
                            className={`border-2 border-dashed rounded-xl cursor-pointer transition-all group ${isDragging
                                ? 'border-[#ff4655] bg-[#ff4655]/10'
                                : pendingFiles.length > 0
                                    ? 'border-white/5 p-4 hover:border-[#ff4655]/50 hover:bg-[#ff4655]/5'
                                    : 'border-white/10 p-8 hover:border-[#ff4655]/50 hover:bg-[#ff4655]/5'
                                }`}
                        >
                            <div className={`flex items-center justify-center gap-3 ${pendingFiles.length > 0 ? '' : 'flex-col'}`}>
                                <div
                                    className={`rounded-full bg-white/5 border border-white/10 group-hover:bg-[#ff4655]/10 group-hover:border-[#ff4655]/30 flex items-center justify-center transition-colors ${pendingFiles.length > 0 ? 'w-10 h-10' : 'w-16 h-16 mb-2'
                                        }`}
                                >
                                    <Icon
                                        name="Plus"
                                        size={pendingFiles.length > 0 ? 20 : 32}
                                        className="text-gray-500 group-hover:text-[#ff4655] transition-colors"
                                    />
                                </div>
                                <div className={pendingFiles.length > 0 ? '' : 'text-center'}>
                                    <p className="text-white font-semibold text-sm">
                                        {isDragging
                                            ? '释放文件开始添加'
                                            : pendingFiles.length > 0
                                                ? '添加更多文件'
                                                : '点击或拖拽 ZIP 文件到此处'}
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

                {/* 上传进度 */}
                {isUploading && progress && (
                    <div className="p-4 border-t border-white/10 bg-[#1a1d21]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center justify-center">
                                <Icon name="Loader" size={20} className="text-[#ff4655] animate-spin" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-sm font-medium">
                                    正在上传 ({progress.current}/{progress.total})
                                </p>
                                <p className="text-gray-500 text-xs">{progress.status}</p>
                            </div>
                        </div>
                        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#ff4655] transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 操作按钮 */}
            {validFilesCount > 0 && !isUploading && (
                <div className="flex justify-end">
                    <button
                        onClick={handleStartUpload}
                        disabled={!ossConfig}
                        className="px-6 py-3 bg-[#ff4655] hover:bg-[#ff5a67] text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-[#ff4655]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Icon name="Upload" size={18} />
                        上传到共享库 ({validFilesCount})
                    </button>
                </div>
            )}
        </div>
    );
}

export default LineupUploadPage;
