/**
 * LineupUploadPage - 批量点位上传页
 * 
 * 职责：
 * - 允许管理员通过批量选择 ZIP 文件直接创建点位
 * - 自动从 ZIP 文件名/内容中提取元数据，并在上传前提供预览
 * - 调用 adminUpload 服务完成大规模点位导入
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '../../../components/Icon';
import { parseZipMetadata, adminUploadLineup, AdminUploadProgress } from '../../../lib/adminUpload';
import { useEmailAuth } from '../../../hooks/useEmailAuth';
import { adminSupabase } from '../../../supabaseClient';
import { ImageBedConfig } from '../../../types/imageBed';
import { MAP_TRANSLATIONS } from '../../../constants/maps';

interface PendingUpload {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress?: number;
    error?: string;
    metadata?: {
        title: string;
        mapName: string;
        agentName: string;
        side: 'attack' | 'defense';
        imageCount: number;
    };
}

interface LineupUploadPageProps {
    setAlertMessage: (msg: string | null) => void;
}

const MAX_FILES = 50;
const SYSTEM_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

const LineupUploadPage: React.FC<LineupUploadPageProps> = ({ setAlertMessage }) => {
    const { user } = useEmailAuth();
    const [pendingFiles, setPendingFiles] = useState<PendingUpload[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [imageBedConfig, setImageBedConfig] = useState<ImageBedConfig | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 加载图床配置
    useEffect(() => {
        const loadConfig = async () => {
            const { data } = await adminSupabase
                .from('system_settings')
                .select('value')
                .eq('key', 'image_bed_config')
                .single();

            if (data?.value) {
                setImageBedConfig(data.value as ImageBedConfig);
            }
        };
        loadConfig();
    }, []);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newPending: PendingUpload[] = [];

        for (const file of files) {
            if (pendingFiles.length + newPending.length >= MAX_FILES) break;

            try {
                const metadata = await parseZipMetadata(file);
                if (!metadata) throw new Error('解析失败');
                newPending.push({
                    file,
                    status: 'pending',
                    metadata: {
                        title: metadata.title || file.name.replace('.zip', ''),
                        mapName: metadata.mapName,
                        agentName: metadata.agentName,
                        side: metadata.side || 'attack',
                        imageCount: metadata.imageCount || 0
                    }
                });
            } catch (err) {
                console.error('解析失败:', file.name, err);
                newPending.push({
                    file,
                    status: 'error',
                    error: '解析元数据失败'
                });
            }
        }

        setPendingFiles(prev => [...prev, ...newPending]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [pendingFiles]);

    const handleRemove = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadAll = async () => {
        if (!imageBedConfig) {
            alert('图床配置未加载，请刷新页面');
            return;
        }

        setIsUploading(true);
        const filesToUpload = pendingFiles.filter(f => f.status === 'pending' || f.status === 'error');

        for (const item of filesToUpload) {
            const index = pendingFiles.findIndex(f => f === item);

            // 更新状态为上传中
            setPendingFiles(prev => {
                const next = [...prev];
                next[index] = { ...next[index], status: 'uploading', progress: 0 };
                return next;
            });

            try {
                const result = await adminUploadLineup(
                    item.file,
                    user?.email || '',
                    imageBedConfig,
                    (p: AdminUploadProgress) => {
                        const percent = p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
                        setPendingFiles(prev => {
                            const next = [...prev];
                            next[index] = { ...next[index], progress: percent };
                            return next;
                        });
                    }
                );

                if (result.success) {
                    setPendingFiles(prev => {
                        const next = [...prev];
                        next[index] = { ...next[index], status: 'success', progress: 100 };
                        return next;
                    });
                } else {
                    throw new Error(result.errorMessage);
                }
            } catch (err: any) {
                setPendingFiles(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], status: 'error', error: err.message || '上传失败' };
                    return next;
                });
            }
        }

        setIsUploading(false);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">批量上传点位</h1>
                    <p className="text-gray-400">支持批量上传 ZIP 点位包，系统将自动解析元数据并分类</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setPendingFiles([])}
                        disabled={isUploading || pendingFiles.length === 0}
                        className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        清空列表
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || pendingFiles.length >= MAX_FILES}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Icon name="Plus" size={18} />
                        选择文件
                    </button>
                    <button
                        onClick={handleUploadAll}
                        disabled={isUploading || pendingFiles.filter(f => f.status === 'pending' || f.status === 'error').length === 0}
                        className="px-6 py-2 rounded-lg bg-[#ff4655] hover:bg-[#ff5a67] text-white font-bold transition-colors flex items-center gap-2 shadow-lg shadow-[#ff4655]/20 disabled:opacity-50"
                    >
                        {isUploading ? <Icon name="Loader" size={18} className="animate-spin" /> : <Icon name="Upload" size={18} />}
                        开始上传
                    </button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
            />

            {pendingFiles.length === 0 ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl py-20 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all group"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon name="UploadCloud" size={32} className="text-gray-500" />
                    </div>
                    <p className="text-white font-medium mb-1">点击或拖拽 ZIP 文件至此</p>
                    <p className="text-gray-500 text-sm">每次最多上传 {MAX_FILES} 个文件</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingFiles.map((item, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-xl border transition-all ${item.status === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' :
                                item.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                                    item.status === 'uploading' ? 'border-[#ff4655]/30 bg-[#ff4655]/5' :
                                        'border-white/10 bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                                    <Icon name="FileArchive" size={20} className="text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-white font-medium truncate">{item.metadata?.title || item.file.name}</span>
                                        {!isUploading && item.status !== 'success' && (
                                            <button onClick={() => handleRemove(index)} className="text-gray-500 hover:text-white">
                                                <Icon name="X" size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {item.status === 'success' ? (
                                            <span className="text-emerald-400 flex items-center gap-1">
                                                <Icon name="CheckCircle" size={12} /> 上传成功
                                            </span>
                                        ) : item.status === 'error' ? (
                                            <span className="text-red-400 flex items-center gap-1" title={item.error}>
                                                <Icon name="AlertCircle" size={12} /> {item.error || '上传失败'}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">
                                                {item.metadata ?
                                                    `${MAP_TRANSLATIONS[item.metadata.mapName] || item.metadata.mapName} · ${item.metadata.agentName} · ${item.metadata.imageCount} 图` :
                                                    '未解析'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {(item.status === 'uploading' || item.status === 'success') && (
                                <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${item.status === 'success' ? 'bg-emerald-500' : 'bg-[#ff4655]'}`}
                                        style={{ width: `${item.progress || 0}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LineupUploadPage;
