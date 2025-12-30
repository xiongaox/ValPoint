/**
 * DownloadLogsPage - 下载记录审计页
 * 
 * 职责：
 * - 列表展示所有用户的点位下载行为日志
 * - 支持按时间范围筛选
 * - 显示下载统计数据
 */
import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/Icon';
import UserAvatar from '../../../components/UserAvatar';
import { adminSupabase } from '../../../supabaseClient';
import { MAP_TRANSLATIONS } from '../../../constants/maps';

interface DownloadLog {
    id: string;
    user_id: string;
    user_email: string;
    lineup_id: string;
    lineup_title: string;
    map_name: string;
    agent_name: string;
    download_count: number;
    created_at: string;
}

interface Statistics {
    today: number;
    week: number;
    month: number;
}

/**
 * 下载日志页面
 */
function DownloadLogsPage() {
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
    const [logs, setLogs] = useState<DownloadLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<Statistics>({ today: 0, week: 0, month: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const PAGE_SIZE = 20;

    // 获取日期范围
    const getDateRange = (range: 'today' | 'week' | 'month') => {
        const now = new Date();
        let start: Date;

        if (range === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (range === 'week') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        } else {
            start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }

        return start.toISOString();
    };

    // 加载日志数据
    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const from = (currentPage - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const startDate = getDateRange(dateRange);

            const { data, error, count } = await adminSupabase
                .from('download_logs')
                .select('*', { count: 'exact' })
                .gte('created_at', startDate)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('加载下载日志失败:', error);
                return;
            }

            setLogs(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error('加载下载日志异常:', err);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, currentPage]);

    // 加载统计数据
    const loadStats = useCallback(async () => {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
            const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();

            // 今日下载
            const { count: todayCount } = await adminSupabase
                .from('download_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayStart);

            // 本周下载
            const { count: weekCount } = await adminSupabase
                .from('download_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', weekStart);

            // 本月下载
            const { count: monthCount } = await adminSupabase
                .from('download_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', monthStart);

            setStats({
                today: todayCount || 0,
                week: weekCount || 0,
                month: monthCount || 0,
            });
        } catch (err) {
            console.error('加载统计数据失败:', err);
        }
    }, []);

    // 初始加载
    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // 日期范围变化时重置分页
    useEffect(() => {
        setCurrentPage(1);
    }, [dateRange]);

    // 计算分页
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // 格式化时间
    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 获取地图显示名称
    const getMapDisplayName = (name: string) => {
        return MAP_TRANSLATIONS[name?.trim()] || name;
    };

    return (
        <div className="space-y-6">
            {/* 筛选栏 */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {(['today', 'week', 'month'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${dateRange === range
                                ? 'bg-[#ff4655] text-white'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {range === 'today' ? '今天' : range === 'week' ? '本周' : '本月'}
                        </button>
                    ))}
                </div>
                <button
                    onClick={loadLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
                >
                    <Icon name="RefreshCw" size={16} />
                    刷新
                </button>
            </div>

            {/* 日志表格 */}
            <div className="bg-[#1f2326] rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                用户
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                点位
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                地图
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                特工
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                下载时间
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-gray-500 text-sm">加载中...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Icon name="FileText" size={32} className="text-gray-600" />
                                        <span className="text-gray-500">暂无下载记录</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar email={log.user_email} size={32} className="rounded-lg" />
                                            <span className="text-sm text-white">{log.user_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-white">{log.lineup_title || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-400">
                                            {getMapDisplayName(log.map_name) || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-400">{log.agent_name || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-500">{formatTime(log.created_at)}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>共 {totalCount} 条记录 · 第 {currentPage}/{totalPages} 页</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            上一页
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            )}

            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4">
                    <div className="text-2xl font-bold text-white">{stats.today.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">今日下载</div>
                </div>
                <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4">
                    <div className="text-2xl font-bold text-white">{stats.week.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">本周下载</div>
                </div>
                <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4">
                    <div className="text-2xl font-bold text-white">{stats.month.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">本月下载</div>
                </div>
            </div>
        </div>
    );
}

export default DownloadLogsPage;
