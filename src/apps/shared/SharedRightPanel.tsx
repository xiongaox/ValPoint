/**
 * SharedRightPanel - 共享库右侧面板
 *
 * 职责：
 * - 承载共享库右侧面板相关信息与操作入口。
 * - 组织内部子模块的布局与显示状态。
 * - 向父级汇报用户操作或选择。
 */

import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { BaseLineup } from '../../types/lineup';
import PendingSubmissionsTab from './PendingSubmissionsTab';

interface SharedRightPanelProps {
    activeTab: 'view' | 'submit' | 'pending';
    onTabSwitch: (tab: 'view' | 'submit' | 'pending') => void;
    isLoading: boolean;
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    selectedSide: 'all' | 'attack' | 'defense';
    setSelectedSide: (v: 'all' | 'attack' | 'defense') => void;
    filteredLineups: BaseLineup[];
    selectedLineupId: string | null;
    handleViewLineup: (id: string) => void;
    handleDownload: (id: string, e?: React.MouseEvent) => void;
    getMapDisplayName: (name: string) => string;
    onOpenFilter: () => void;
    userId?: string | null;
    submissionEnabled?: boolean; // 说明：投稿开关。
    layoutMode?: 'desktop' | 'tablet-drawer';
    className?: string;
}

function SharedRightPanel({
    activeTab,
    onTabSwitch,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedSide,
    setSelectedSide,
    filteredLineups,
    selectedLineupId,
    handleViewLineup,
    handleDownload,
    getMapDisplayName,
    onOpenFilter,
    userId,
    submissionEnabled = true,
    layoutMode = 'desktop',
    className = '',
}: SharedRightPanelProps) {
    const isTabletDrawer = layoutMode === 'tablet-drawer';
    const pageSize = 7;
    const [page, setPage] = useState(1);
    const showPagination = filteredLineups.length > 8;
    const totalPages = Math.max(1, Math.ceil(filteredLineups.length / pageSize));

    useEffect(() => {
        setPage(1);
    }, [filteredLineups]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const visibleLineups = useMemo(() => {
        if (!showPagination) return filteredLineups;
        const start = (page - 1) * pageSize;
        return filteredLineups.slice(start, start + pageSize);
    }, [filteredLineups, page, showPagination]);

    return (
        <div className={`${isTabletDrawer ? 'w-[360px] max-w-[calc(100vw-18rem)] h-full' : 'w-96'} flex-shrink-0 flex flex-col bg-[#1f2326] border-l border-white/10 z-20 shadow-2xl ${className}`.trim()}>
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => onTabSwitch?.('view')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-colors ${activeTab === 'view' ? 'bg-[#ff4655] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Icon name="Search" size={18} /> 查看点位
                </button>
                {submissionEnabled && (
                    <>
                        <button
                            onClick={() => onTabSwitch?.('pending')}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-colors ${activeTab === 'pending' ? 'bg-[#ff4655] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon name="Clock" size={18} /> 待审点位
                        </button>
                        <button
                            onClick={() => onTabSwitch?.('submit')}
                            className="py-4 px-4 flex items-center justify-center border-l border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="投稿点位"
                        >
                            <Icon name="Send" size={18} />
                        </button>
                    </>
                )}
            </div>

            {activeTab === 'pending' ? (
                <PendingSubmissionsTab userId={userId || null} />
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="搜索点位标题..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 bg-[#0f1923] border border-gray-700 rounded-lg pl-10 pr-4 text-sm text-white focus:border-[#ff4655] outline-none transition-colors"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                <Icon name="Search" size={16} />
                            </div>
                        </div>
                        <button
                            onClick={onOpenFilter}
                            className="h-12 px-3 whitespace-nowrap font-bold rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider transition-colors"
                            style={{ backgroundColor: 'rgb(16, 185, 129)' }}
                        >
                            <Icon name="Filter" size={16} />
                            筛选共享
                        </button>
                    </div>

                    <div className="flex bg-[#0f1923] p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setSelectedSide('all')}
                            className={`flex-1 py-2 rounded text-xs font-bold transition-all border ${selectedSide === 'all' ? 'bg-gray-600 text-white border-gray-500 shadow' : 'text-gray-500 border-transparent hover:text-white'
                                }`}
                        >
                            全部
                        </button>
                        <button
                            onClick={() => setSelectedSide('attack')}
                            className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all border ${selectedSide === 'attack' ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow' : 'text-gray-500 border-transparent hover:text-red-400'
                                }`}
                        >
                            <Icon name="Sword" size={14} /> 进攻
                        </button>
                        <button
                            onClick={() => setSelectedSide('defense')}
                            className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all border ${selectedSide === 'defense'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow'
                                : 'text-gray-500 border-transparent hover:text-emerald-400'
                                }`}
                        >
                            <Icon name="Shield" size={14} /> 防守
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="w-8 h-8 border-3 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredLineups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Icon name="Search" size={48} className="mb-2 opacity-20" />
                                <span className="text-xs">暂无相关点位</span>
                            </div>
                        ) : (
                            visibleLineups.map((l) => (
                                <div
                                    key={l.id}
                                    onClick={() => handleViewLineup(l.id)}
                                    className={`group relative p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-4 h-20 ${selectedLineupId === l.id ? 'bg-[#ff4655]/10 border-[#ff4655] shadow-md' : 'bg-[#0f1923] border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="relative">
                                        {l.agentIcon ? (
                                            <img src={l.agentIcon} className="w-10 h-10 rounded-full border border-white/10" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs">{l.agentName?.[0]}</div>
                                        )}
                                        {l.skillIcon && <img src={l.skillIcon} className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1f2326] rounded-full p-0.5 border border-white/20" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between gap-2 items-center mb-1">
                                            <h4 className={`text-sm font-bold truncate ${selectedLineupId === l.id ? 'text-[#ff4655]' : 'text-white'}`}>{l.title}</h4>
                                            <div className="flex gap-1 text-[12px] text-gray-500 shrink-0">
                                                <span>{getMapDisplayName(l.mapName)}</span>
                                                <span>·</span>
                                                <span>{l.agentName}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${l.side === 'attack'
                                                    ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                                    : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                                    }`}
                                            >
                                                {l.side === 'attack' ? '进攻' : '防守'}
                                            </span>
                                        </div>
                                    </div>
                                    {(l.creatorId || l.authorUid) && (
                                        <span
                                            className="absolute top-10 right-4 text-[14px] text-gray-400 truncate max-w-[80px]"
                                            title={`ID: ${l.creatorId || l.authorUid}`}
                                        >
                                            {l.creatorId || l.authorUid}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {showPagination && (
                        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-200">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={`px-4 py-2 rounded-lg border transition-colors ${page === 1
                                    ? 'border-white/5 text-gray-600 cursor-not-allowed'
                                    : 'border-white/10 text-white hover:border-white/40 hover:bg-white/5'
                                    }`}
                            >
                                上一页
                            </button>
                            <div className="px-4 h-10 flex items-center justify-center rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs">
                                {page} / {totalPages}
                            </div>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className={`px-4 py-2 rounded-lg border transition-colors ${page === totalPages
                                    ? 'border-white/5 text-gray-600 cursor-not-allowed'
                                    : 'border-[#ff4655]/60 text-white bg-[#ff4655]/10 hover:bg-[#ff4655]/20 hover:border-[#ff4655]'
                                    }`}
                            >
                                下一页
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SharedRightPanel;
