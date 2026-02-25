/**
 * SubscriptionModal - 应用壳层(shared)
 *
 * 模块定位：
 * - 所在层级：应用壳层(shared)
 * - 主要目标：承载共享库业务流程与 UI 组合
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `SubscriptionModal`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`lucide-react`、`../logic/subscription`、`../../../components/AlertModal`
 * - 下游影响：供 index.html 入口挂载
 */

import React, { useState } from 'react';
import { X, Plus, Check, Trash2, Globe, Server, Info, ChevronUp, ChevronDown, Pencil, AlertTriangle, ExternalLink } from 'lucide-react';
import { Subscription, fetchManifest } from '../logic/subscription';
import AlertModal from '../../../components/AlertModal';
import { useEscapeClose } from '../../../hooks/useEscapeClose';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    subscriptions: Subscription[];
    currentSubscription: Subscription;
    onSetSubscription: (sub: Subscription) => void;
    onAddSubscription: (sub: Subscription) => void;
    onRemoveSubscription: (id: string) => void;
    onUpdateSubscription: (sub: Subscription) => void;
    onReorderSubscription: (id: string, direction: 'up' | 'down') => void;
}

export function SubscriptionModal({
    isOpen,
    onClose,
    subscriptions,
    currentSubscription,
    onSetSubscription,
    onAddSubscription,
    onUpdateSubscription,
    onRemoveSubscription,
    onReorderSubscription,
}: SubscriptionModalProps) {
    const [view, setView] = useState<'list' | 'add' | 'edit' | 'delete'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState<string>('');
    const [addUrl, setAddUrl] = useState('');
    const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [checkResult, setCheckResult] = useState<Subscription | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEscapeClose(isOpen, onClose);

    if (!isOpen) return null;

    if (view === 'delete') {
        return (
            <AlertModal
                message={`您确定要删除订阅源 "${deleteName}" 吗？ 删除后，您将无法访问该源提供的所有点位数据。`}
                title="确认删除订阅"
                subtitle="安全操作"
                variant="danger"
                onClose={() => {
                    setDeleteId(null);
                    setView('list');
                }}
                actionLabel="确认删除"
                onAction={() => {
                    if (deleteId) {
                        onRemoveSubscription(deleteId);
                        setDeleteId(null);
                        setView('list');
                    }
                }}
                secondaryLabel="取消"
                onSecondary={() => {
                    setDeleteId(null);
                    setView('list');
                }}
            />
        );
    }

    const handleCheck = async () => {
        if (!addUrl) return;
        setCheckStatus('checking');
        setErrorMsg('');
        try {
            const result = await fetchManifest(addUrl);
            setCheckResult(result);
            setCheckStatus('success');
        } catch (e: any) {
            setCheckStatus('error');
            setErrorMsg(e.message || 'Connection failed');
        }
    };

    const handleConfirmAdd = () => {
        if (checkResult) {
            if (view === 'edit' && editingId) {
                onUpdateSubscription({
                    ...checkResult,
                    id: editingId
                });
            } else {
                onAddSubscription(checkResult);
            }
            resetAddForm();
            setView('list');
        }
    };

    const resetAddForm = () => {
        setAddUrl('');
        setCheckStatus('idle');
        setCheckResult(null);
        setErrorMsg('');
    };

    const getHeaderContent = () => {
        switch (view) {
            case 'add':
                return {
                    icon: <Plus className="w-5 h-5" />,
                    title: "添加新订阅",
                    subtitle: "NEW SUBSCRIPTION"
                };
            case 'edit':
                return {
                    icon: <Pencil className="w-5 h-5" />,
                    title: "编辑订阅",
                    subtitle: "EDIT CONFIGURATION"
                };
            default:
                return {
                    icon: <Globe className="w-5 h-5" />,
                    title: "切换订阅源",
                    subtitle: "SWITCH SOURCE"
                };
        }
    };

    const header = getHeaderContent();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#181b1f]/95 w-full max-w-md rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1c2028] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border bg-[#ff4655]/15 border-[#ff4655]/35 text-[#ff4655]">
                            {header.icon}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <h3 className="text-lg font-bold text-white">{header.title}</h3>
                            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold">{header.subtitle}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#181b1f]">
                    {view === 'list' ? (
                        <div className="space-y-3">
                            {subscriptions.map((sub, index) => {
                                const isActive = sub.id === currentSubscription.id;
                                const isLocal = sub.id === 'local';
                                return (
                                    <div
                                        key={sub.id}
                                        onClick={() => onSetSubscription(sub)}
                                        className={`group relative p-4 rounded-xl border cursor-pointer transition-all ${isActive
                                            ? 'bg-[#ff4655]/10 border-[#ff4655] shadow-[0_0_15px_rgba(255,70,85,0.15)]'
                                            : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isActive
                                                ? 'border-[#ff4655] bg-[#ff4655]'
                                                : 'border-white/20 group-hover:border-white/40'
                                                }`}>
                                                {isActive && <Check className="w-3 h-3 text-white" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`font-bold text-base truncate ${isActive ? 'text-[#ff4655]' : 'text-gray-200'}`}>
                                                        {sub.name}
                                                    </h3>
                                                    {isLocal && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-wider font-semibold">Official</span>}
                                                    {sub.mode === 'redirect' ? (
                                                        <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                                                            <ExternalLink className="w-2.5 h-2.5" />跳转
                                                        </span>
                                                    ) : (
                                                        !isLocal && <span className="text-[10px] bg-green-500/20 px-1.5 py-0.5 rounded text-green-400 uppercase tracking-wider font-semibold">嵌入</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{sub.url}</p>
                                                {sub.description && (
                                                    <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">{sub.description}</p>
                                                )}
                                            </div>

                                            {!isLocal && (
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 border-l border-white/5 shrink-0">
                                                    <div className="flex gap-1 mb-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onReorderSubscription(sub.id, 'up'); }}
                                                            disabled={index <= 1} // 说明：第一个自定义项（索引 1）不可上移。
                                                            className="p-1.5 text-gray-400 hover:text-white bg-black/40 rounded hover:bg-black/60 transition-colors disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-black/40"
                                                            title="上移"
                                                        >
                                                            <ChevronUp className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onReorderSubscription(sub.id, 'down'); }}
                                                            disabled={index >= subscriptions.length - 1}
                                                            className="p-1.5 text-gray-400 hover:text-white bg-black/40 rounded hover:bg-black/60 transition-colors disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-black/40"
                                                            title="下移"
                                                        >
                                                            <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAddUrl(sub.url);
                                                                setEditingId(sub.id);
                                                                setView('edit');
                                                                setCheckStatus('idle');
                                                                setCheckResult(null);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-[#ff4655] bg-black/40 rounded hover:bg-black/60 transition-colors"
                                                            title="编辑"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteId(sub.id);
                                                                setDeleteName(sub.name);
                                                                setView('delete');
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 bg-black/40 rounded hover:bg-black/60 transition-colors"
                                                            title="删除"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">订阅链接 (URL)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={addUrl}
                                        onChange={(e) => setAddUrl(e.target.value)}
                                        placeholder="例如: https://val.example.com"
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#ff4655]/50 focus:bg-black/30 transition-all font-mono text-sm"
                                    />
                                    <button
                                        onClick={handleCheck}
                                        disabled={!addUrl || checkStatus === 'checking'}
                                        className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-300 px-4 rounded-lg font-medium transition-all disabled:opacity-50 text-sm whitespace-nowrap"
                                    >
                                        {checkStatus === 'checking' ? '检测中...' : '检测有效性'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600 mt-2">
                                    输入对方的 ValPoint Federation 兼容站点域名即可。
                                </p>
                            </div>

                            {checkStatus === 'error' && (
                                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg flex items-start gap-3">
                                    <Info className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-bold text-red-200">检测失败</p>
                                        <p className="text-red-400/80 text-xs mt-0.5">{errorMsg}</p>
                                    </div>
                                </div>
                            )}

                            {checkStatus === 'success' && checkResult && (
                                <div className="p-4 bg-[#ff4655]/5 border border-[#ff4655]/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <h4 className="font-bold text-[#ff4655] flex items-center gap-2 mb-2 text-sm">
                                        <Check className="w-4 h-4" /> 源信息有效
                                    </h4>
                                    <div className="space-y-1 pl-6">
                                        <p className="text-gray-200 font-medium">{checkResult.name}</p>
                                        <p className="text-gray-500 text-sm">{checkResult.description || '无描述信息'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-white/10 shrink-0 bg-[#181b1f] flex justify-end gap-3 rounded-b-2xl">
                    {view === 'list' ? (
                        <button
                            onClick={() => setView('add')}
                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-md shadow-red-900/20 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> 添加订阅
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    resetAddForm();
                                    setView('list');
                                }}
                                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-gray-300 hover:border-white/30 hover:text-white transition-colors"
                            >
                                返回
                            </button>
                            <button
                                onClick={handleConfirmAdd}
                                disabled={checkStatus !== 'success'}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#ff5b6b] to-[#ff3c4d] hover:from-[#ff6c7b] hover:to-[#ff4c5e] shadow-md shadow-red-900/30 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                {view === 'edit' ? '确认更新' : '确认添加'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
