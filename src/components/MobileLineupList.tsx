/**
 * MobileLineupList - 移动端点位列表弹窗
 * 
 * 以底部抽屉形式展示点位列表，点击可定位到地图上的点位
 * 显示置顶状态（不可操作）
 */
import React from 'react';
import Icon from './Icon';
import { BaseLineup } from '../types/lineup';

interface MobileLineupListProps {
    isOpen: boolean;
    onClose: () => void;
    lineups: BaseLineup[];
    selectedLineupId: string | null;
    onSelectLineup: (id: string) => void;
    isLoading?: boolean;
    pinnedLineupIds?: string[]; // 置顶的点位ID列表
}

function MobileLineupList({
    isOpen,
    onClose,
    lineups,
    selectedLineupId,
    onSelectLineup,
    isLoading = false,
    pinnedLineupIds = [],
}: MobileLineupListProps) {
    if (!isOpen) return null;

    const handleSelect = (id: string) => {
        onSelectLineup(id);
        onClose();
    };

    // 判断是否置顶
    const isPinned = (id: string) => pinnedLineupIds.includes(id);

    // 搜索状态
    const [searchQuery, setSearchQuery] = React.useState('');

    // 根据搜索词过滤点位
    const filteredLineups = React.useMemo(() => {
        if (!searchQuery.trim()) return lineups;
        const query = searchQuery.toLowerCase();
        return lineups.filter(
            (l) => l.title.toLowerCase().includes(query) || l.agentName?.toLowerCase().includes(query)
        );
    }, [lineups, searchQuery]);

    return (
        <>
            {/* 背景遮罩 */}
            <div
                className="fixed inset-0 bg-black/60 z-[1000] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* 底部抽屉 - 纯像素高度避免键盘影响 */}
            <div className="fixed inset-x-0 bottom-0 z-[1001] bg-[#1f2326] rounded-t-2xl animate-in slide-in-from-bottom duration-300 flex flex-col h-[450px]">
                {/* 头部 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Icon name="List" size={18} className="text-[#ff4655]" />
                        <h3 className="text-white font-semibold">点位列表</h3>
                        <span className="text-gray-500 text-sm">({filteredLineups.length})</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                {/* 搜索框 */}
                <div className="px-4 py-3 border-b border-white/10">
                    <div className="relative">
                        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索点位或角色..."
                            className="w-full h-10 pl-10 pr-4 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:border-[#ff4655] focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                <Icon name="X" size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 点位列表 */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-8 h-8 border-3 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredLineups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <Icon name="Search" size={32} className="mb-2 opacity-30" />
                            <span className="text-sm">{searchQuery ? '未找到匹配点位' : '暂无点位'}</span>
                        </div>
                    ) : (
                        <div className="p-3 space-y-2">
                            {filteredLineups.map((lineup) => {
                                const isSelected = selectedLineupId === lineup.id;
                                const pinned = isPinned(lineup.id);
                                return (
                                    <button
                                        key={lineup.id}
                                        onClick={() => handleSelect(lineup.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isSelected
                                            ? 'bg-[#ff4655]/20 border border-[#ff4655]'
                                            : 'bg-white/5 border border-transparent hover:bg-white/10'
                                            }`}
                                    >
                                        {/* 角色头像 */}
                                        <div className="relative shrink-0">
                                            {lineup.agentIcon ? (
                                                <img
                                                    src={lineup.agentIcon}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full border border-white/10"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                                                    {lineup.agentName?.[0]}
                                                </div>
                                            )}
                                            {/* 攻防标记 */}
                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${lineup.side === 'attack'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-emerald-500 text-white'
                                                }`}>
                                                {lineup.side === 'attack' ? '攻' : '守'}
                                            </div>
                                        </div>

                                        {/* 点位信息 */}
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold truncate ${isSelected ? 'text-[#ff4655]' : 'text-white'}`}>
                                                    {lineup.title}
                                                </span>
                                                {/* 置顶状态标记 */}
                                                {pinned && (
                                                    <span className="shrink-0 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">
                                                        置顶
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {lineup.agentName}
                                            </div>
                                        </div>

                                        {/* 箭头图标 */}
                                        <Icon
                                            name="ChevronRight"
                                            size={16}
                                            className="text-gray-500 shrink-0"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default MobileLineupList;
