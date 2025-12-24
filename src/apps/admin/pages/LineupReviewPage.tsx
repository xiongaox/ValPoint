/**
 * 点位审核页面
 * 三栏布局：左侧待审列表 / 中间地图预览（带标记点）/ 右侧详情+图片+操作
 */
import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/Icon';
import { LineupSubmission } from '../../../types/submission';
import { getPendingSubmissions, approveSubmission, rejectSubmission } from '../../../lib/reviewService';
import { getSystemSettings } from '../../../lib/systemSettings';
import { ImageBedConfig } from '../../../types/imageBed';
import ReviewMapPreview from '../components/ReviewMapPreview';
import { MAP_TRANSLATIONS } from '../../../constants/maps';
import Lightbox from '../../../components/Lightbox';
import { LightboxImage } from '../../../types/ui';

function LineupReviewPage() {
    const [submissions, setSubmissions] = useState<LineupSubmission[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [ossConfig, setOssConfig] = useState<ImageBedConfig | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [viewingImage, setViewingImage] = useState<LightboxImage | null>(null);

    // 当前选中的投稿
    const selected = submissions.find((s) => s.id === selectedId) || null;

    // 加载待审投稿和系统设置
    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [subs, settings] = await Promise.all([
            getPendingSubmissions(),
            getSystemSettings(),
        ]);
        setSubmissions(subs);
        if (settings?.official_oss_config) {
            setOssConfig(settings.official_oss_config);
        }
        // 自动选中第一个
        if (subs.length > 0 && !selectedId) {
            setSelectedId(subs[0].id);
        }
        setIsLoading(false);
    }, [selectedId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 消息自动消失
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // 审核通过
    const handleApprove = async () => {
        if (!selected || !ossConfig) return;

        setIsProcessing(true);
        setMessage(null);

        const reviewerId = '00000000-0000-0000-0000-000000000001';

        const result = await approveSubmission(selected, reviewerId, ossConfig);

        if (result.success) {
            setMessage({ type: 'success', text: '审核通过，点位已添加到共享库' });
            setSubmissions((prev) => prev.filter((s) => s.id !== selected.id));
            const remaining = submissions.filter((s) => s.id !== selected.id);
            setSelectedId(remaining.length > 0 ? remaining[0].id : null);
        } else {
            setMessage({ type: 'error', text: result.error || '审核失败' });
        }

        setIsProcessing(false);
    };

    // 打开拒绝弹窗
    const handleOpenReject = () => {
        setRejectReason('');
        setShowRejectModal(true);
    };

    // 确认拒绝
    const handleConfirmReject = async () => {
        if (!selected || !rejectReason.trim()) return;

        setIsProcessing(true);
        setMessage(null);

        const reviewerId = '00000000-0000-0000-0000-000000000001';

        const result = await rejectSubmission(selected.id, reviewerId, rejectReason.trim());

        if (result.success) {
            setMessage({ type: 'success', text: '已拒绝该投稿' });
            setSubmissions((prev) => prev.filter((s) => s.id !== selected.id));
            const remaining = submissions.filter((s) => s.id !== selected.id);
            setSelectedId(remaining.length > 0 ? remaining[0].id : null);
        } else {
            setMessage({ type: 'error', text: result.error || '拒绝失败' });
        }

        setShowRejectModal(false);
        setIsProcessing(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex gap-4">
            {/* 消息提示 */}
            {message && (
                <div
                    className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                        } text-white`}
                >
                    {message.text}
                </div>
            )}

            {/* 左侧：待审列表 */}
            <div className="w-56 flex-shrink-0 bg-[#1f2326] rounded-xl border border-white/10 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold">待审点位</h3>
                    <span className="text-xs text-gray-500">{submissions.length} 条</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Icon name="CheckCircle" size={48} className="mb-2 opacity-20" />
                            <span className="text-sm">暂无待审点位</span>
                        </div>
                    ) : (
                        submissions.map((sub) => (
                            <div
                                key={sub.id}
                                onClick={() => setSelectedId(sub.id)}
                                className={`p-3 border-b border-white/5 cursor-pointer transition-colors ${selectedId === sub.id
                                    ? 'bg-[#ff4655]/10 border-l-2 border-l-[#ff4655]'
                                    : 'hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs overflow-hidden">
                                        {sub.agent_icon ? (
                                            <img src={sub.agent_icon} alt={sub.agent_name} className="w-full h-full object-cover" />
                                        ) : (
                                            sub.agent_name?.[0] || '?'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-white truncate">{sub.title}</h4>
                                        <div className="text-xs text-gray-500">
                                            {MAP_TRANSLATIONS[sub.map_name] || sub.map_name} · {sub.agent_name}
                                        </div>
                                    </div>
                                    <span
                                        className={`px-1.5 py-0.5 rounded text-xs ${sub.side === 'attack'
                                            ? 'text-red-400 bg-red-500/10'
                                            : 'text-emerald-400 bg-emerald-500/10'
                                            }`}
                                    >
                                        {sub.side === 'attack' ? '攻' : '守'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 中间：地图预览 */}
            <ReviewMapPreview submission={selected} />

            {/* 右侧：详情+图片+操作 */}
            <div className="w-72 flex-shrink-0 bg-[#1f2326] rounded-xl border border-white/10 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                    <h3 className="font-semibold">点位详情</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selected ? (
                        <>
                            {/* 基本信息 */}
                            <div>
                                <h4 className="text-white font-semibold mb-2">{selected.title}</h4>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="px-2 py-1 bg-white/5 rounded">{MAP_TRANSLATIONS[selected.map_name] || selected.map_name}</span>
                                    <span className="px-2 py-1 bg-white/5 rounded">{selected.agent_name}</span>
                                    <span className={`px-2 py-1 rounded ${selected.side === 'attack' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        {selected.side === 'attack' ? '进攻' : '防守'}
                                    </span>
                                </div>
                            </div>

                            {selected.description && (
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">描述</label>
                                    <p className="text-gray-300 text-sm">{selected.description}</p>
                                </div>
                            )}

                            {/* 点位图片 */}
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block">点位图片</label>
                                <div className="space-y-3">
                                    {[
                                        { src: selected.stand_img, desc: selected.stand_desc, label: '站位' },
                                        { src: selected.stand2_img, desc: selected.stand2_desc, label: '站位 2' },
                                        { src: selected.aim_img, desc: selected.aim_desc, label: '瞄点' },
                                        { src: selected.aim2_img, desc: selected.aim2_desc, label: '瞄点 2' },
                                        { src: selected.land_img, desc: selected.land_desc, label: '落点' },
                                    ].filter(item => item.src).map((item, index) => (
                                        <div key={index} className="space-y-1">
                                            <div
                                                className="cursor-pointer group relative"
                                                onClick={() => {
                                                    const allImages = [
                                                        selected.stand_img,
                                                        selected.stand2_img,
                                                        selected.aim_img,
                                                        selected.aim2_img,
                                                        selected.land_img,
                                                    ].filter(Boolean) as string[];

                                                    setViewingImage({
                                                        src: item.src!,
                                                        list: allImages,
                                                        index: allImages.indexOf(item.src!)
                                                    });
                                                }}
                                            >
                                                <img
                                                    src={item.src}
                                                    alt={item.label}
                                                    className="w-full h-28 object-cover rounded border border-white/10 group-hover:border-[#ff4655] transition-colors"
                                                />
                                                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white backdrop-blur-sm">
                                                    {item.label}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400 leading-snug">
                                                {item.desc || '无描述'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 投稿者信息 */}
                            <div className="pt-3 border-t border-white/10">
                                <label className="text-xs text-gray-400 mb-1 block">投稿者</label>
                                <p className="text-white text-sm">{selected.submitter_email || '未知'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(selected.created_at).toLocaleString('zh-CN')}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Icon name="FileText" size={48} className="mb-2 opacity-20" />
                            <span className="text-sm">选择一个点位查看详情</span>
                        </div>
                    )}
                </div>

                {/* 操作按钮 */}
                {selected && (
                    <div className="p-4 border-t border-white/10 space-y-2">
                        {!ossConfig && (
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                                <Icon name="AlertTriangle" size={14} />
                                请先配置官方图床
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={handleOpenReject}
                                disabled={isProcessing}
                                className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                <Icon name="X" size={16} />
                                拒绝
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isProcessing || !ossConfig}
                                className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                                {isProcessing ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Icon name="Check" size={16} />
                                        通过
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 图片查看弹窗 */}
            <Lightbox viewingImage={viewingImage} setViewingImage={setViewingImage} />

            {/* 拒绝理由弹窗 */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#1f2326] rounded-xl border border-white/10 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">拒绝理由</h3>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                            >
                                <Icon name="X" size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="请输入拒绝理由（将展示给投稿者）"
                                rows={4}
                                className="w-full px-4 py-3 bg-[#0f1923] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                            />
                        </div>
                        <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={!rejectReason.trim() || isProcessing}
                                className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold disabled:opacity-50"
                            >
                                确认拒绝
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LineupReviewPage;
