/**
 * 共享库管理页面
 * 允许管理员查看和删除共享库中的点位
 */
import React, { useEffect, useState, useMemo } from 'react';
import Icon from '../../../components/Icon';
import { getSharedLineups, deleteSharedLineup, SharedLineup } from '../../../lib/reviewService';

const SharedManagePage: React.FC = () => {
    const [lineups, setLineups] = useState<SharedLineup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 筛选条件
    const [filterAgent, setFilterAgent] = useState('');
    const [filterMap, setFilterMap] = useState('');
    const [filterSide, setFilterSide] = useState<'' | 'attack' | 'defense'>('');

    // 加载数据
    const loadData = async () => {
        setIsLoading(true);
        const data = await getSharedLineups();
        setLineups(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // 动态获取特工列表和地图列表
    const agentList = useMemo(() => {
        const agents = [...new Set(lineups.map((l) => l.agent_name))].filter(Boolean).sort();
        return agents;
    }, [lineups]);

    const mapList = useMemo(() => {
        const maps = [...new Set(lineups.map((l) => l.map_name))].filter(Boolean).sort();
        return maps;
    }, [lineups]);

    // 筛选
    const filteredLineups = lineups.filter((item) => {
        // 搜索关键词筛选
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchQuery =
                item.title.toLowerCase().includes(query) ||
                item.map_name.toLowerCase().includes(query) ||
                item.agent_name.toLowerCase().includes(query) ||
                (item.user_id?.toLowerCase().includes(query) ?? false);
            if (!matchQuery) return false;
        }
        // 特工筛选
        if (filterAgent && item.agent_name !== filterAgent) return false;
        // 地图筛选
        if (filterMap && item.map_name !== filterMap) return false;
        // 攻防筛选
        if (filterSide && item.side !== filterSide) return false;
        return true;
    });

    // 删除点位
    const handleDelete = async (shareId: string) => {
        setIsDeleting(true);
        const result = await deleteSharedLineup(shareId);
        setIsDeleting(false);
        setDeleteConfirm(null);

        if (result.success) {
            setMessage({ type: 'success', text: '删除成功' });
            setLineups((prev) => prev.filter((l) => l.share_id !== shareId));
        } else {
            setMessage({ type: 'error', text: `删除失败: ${result.error}` });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    // 重置筛选
    const resetFilters = () => {
        setSearchQuery('');
        setFilterAgent('');
        setFilterMap('');
        setFilterSide('');
    };

    const hasFilters = searchQuery || filterAgent || filterMap || filterSide;

    return (
        <div className="space-y-6">
            {/* 消息提示 */}
            {message && (
                <div
                    className={`p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-red-500/20 border border-red-500/40 text-red-400'
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1f2326] rounded-xl p-6 border border-white/5">
                    <div className="text-3xl font-bold text-white">{lineups.length}</div>
                    <div className="text-sm text-gray-400 mt-1">共享库总点位</div>
                </div>
                <div className="bg-[#1f2326] rounded-xl p-6 border border-white/5">
                    <div className="text-3xl font-bold text-white">
                        {new Set(lineups.map((l) => l.map_name)).size}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">覆盖地图数</div>
                </div>
                <div className="bg-[#1f2326] rounded-xl p-6 border border-white/5">
                    <div className="text-3xl font-bold text-white">
                        {new Set(lineups.map((l) => l.user_id).filter(Boolean)).size}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">贡献者数量</div>
                </div>
            </div>

            {/* 筛选区 */}
            <div className="bg-[#1f2326] rounded-xl border border-white/5 overflow-hidden">
                {/* 顶部搜索和刷新 */}
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="搜索点位标题、用户ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#0f1923] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4655] transition-colors"
                            />
                        </div>
                        <button
                            onClick={loadData}
                            className="p-3 bg-[#0f1923] border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-[#ff4655]/50 transition-all"
                            title="刷新数据"
                        >
                            <Icon name="RefreshCw" size={20} />
                        </button>
                    </div>
                </div>

                {/* 筛选条件区 */}
                <div className="p-4 flex items-center gap-4">
                    {/* 特工筛选 */}
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${filterAgent
                        ? 'bg-[#ff4655]/10 border border-[#ff4655]/30'
                        : 'bg-[#0f1923] border border-white/10 hover:border-white/20'
                        }`}>
                        <Icon name="User" size={16} className={filterAgent ? 'text-[#ff4655]' : 'text-gray-500'} />
                        <select
                            value={filterAgent}
                            onChange={(e) => setFilterAgent(e.target.value)}
                            className="bg-transparent text-sm focus:outline-none cursor-pointer appearance-none pr-6"
                            style={{ color: filterAgent ? 'white' : '#9ca3af' }}
                        >
                            <option value="">全部特工</option>
                            {agentList.map((agent) => (
                                <option key={agent} value={agent}>{agent}</option>
                            ))}
                        </select>
                        <Icon name="ChevronDown" size={14} className="text-gray-500 -ml-5" />
                    </div>

                    {/* 地图筛选 */}
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${filterMap
                        ? 'bg-[#ff4655]/10 border border-[#ff4655]/30'
                        : 'bg-[#0f1923] border border-white/10 hover:border-white/20'
                        }`}>
                        <Icon name="Map" size={16} className={filterMap ? 'text-[#ff4655]' : 'text-gray-500'} />
                        <select
                            value={filterMap}
                            onChange={(e) => setFilterMap(e.target.value)}
                            className="bg-transparent text-sm focus:outline-none cursor-pointer appearance-none pr-6"
                            style={{ color: filterMap ? 'white' : '#9ca3af' }}
                        >
                            <option value="">全部地图</option>
                            {mapList.map((map) => (
                                <option key={map} value={map}>{map}</option>
                            ))}
                        </select>
                        <Icon name="ChevronDown" size={14} className="text-gray-500 -ml-5" />
                    </div>

                    {/* 分隔线 */}
                    <div className="w-px h-6 bg-white/10" />

                    {/* 攻防筛选 - 按钮组 */}
                    <div className="flex items-center gap-1 bg-[#0f1923] rounded-lg p-1">
                        <button
                            onClick={() => setFilterSide(filterSide === 'attack' ? '' : 'attack')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterSide === 'attack'
                                ? 'bg-red-500/20 text-red-400'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            进攻
                        </button>
                        <button
                            onClick={() => setFilterSide(filterSide === 'defense' ? '' : 'defense')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterSide === 'defense'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            防守
                        </button>
                    </div>

                    {/* 右侧区域 */}
                    <div className="ml-auto flex items-center gap-4">
                        {/* 重置按钮 */}
                        {hasFilters && (
                            <button
                                onClick={resetFilters}
                                className="text-sm text-gray-500 hover:text-[#ff4655] transition-colors flex items-center gap-1.5"
                            >
                                <Icon name="RotateCcw" size={14} />
                                重置
                            </button>
                        )}

                        {/* 筛选结果 */}
                        <div className="text-sm">
                            {hasFilters ? (
                                <span className="text-[#ff4655]">{filteredLineups.length}</span>
                            ) : (
                                <span className="text-gray-500">{lineups.length}</span>
                            )}
                            <span className="text-gray-600 ml-1">条记录</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 点位列表 */}
            <div className="bg-[#1f2326] rounded-xl border border-white/5 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-3 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredLineups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Icon name="Inbox" size={48} className="mb-4" />
                        <p>暂无数据</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                <th className="p-4">标题</th>
                                <th className="p-4">地图</th>
                                <th className="p-4">特工</th>
                                <th className="p-4">攻防</th>
                                <th className="p-4">贡献者</th>
                                <th className="p-4">创建时间</th>
                                <th className="p-4 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLineups.map((item) => (
                                <tr key={item.share_id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-4">
                                        <div className="font-medium text-white truncate max-w-[200px]">{item.title}</div>
                                        <div className="text-xs text-gray-500 font-mono">{item.share_id}</div>
                                    </td>
                                    <td className="p-4 text-gray-300">{item.map_name}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {item.agent_icon && (
                                                <img src={item.agent_icon} alt="" className="w-6 h-6 rounded" />
                                            )}
                                            <span className="text-gray-300">{item.agent_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${item.side === 'attack'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-emerald-500/20 text-emerald-400'
                                                }`}
                                        >
                                            {item.side === 'attack' ? '进攻' : '防守'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm truncate max-w-[150px]">
                                        {item.user_id || '-'}
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">
                                        {new Date(item.created_at).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => setDeleteConfirm(item.share_id)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="删除"
                                        >
                                            <Icon name="Trash2" size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 删除确认弹窗 */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-[#1f2326] rounded-xl p-6 w-full max-w-md border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">确认删除</h3>
                        <p className="text-gray-400 mb-6">
                            确定要删除这个点位吗？此操作不可撤销。
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? '删除中...' : '确认删除'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedManagePage;
