/**
 * DashboardPage - 管理后台概览页
 * 
 * 职责：
 * - 展示应用核心指标统计（点位总数、共享总数、用户总数、今日下载等）
 * - 渲染多维度的趋势图表 (Retention, Storage, CDN, API, Reviews)
 * - 提供快速审核入口指示
 */
import React, { useState, useEffect } from 'react';
import Icon, { IconName } from '../../../components/Icon';

// 图表组件
import RetentionChart from '../components/charts/RetentionChart';
import StorageChart from '../components/charts/StorageChart';
import DailyDownloadsChart from '../components/charts/DailyDownloadsChart';
import ReviewStatsChart from '../components/charts/ReviewStatsChart';

interface StatsCard {
    label: string;
    value: number | string;
    icon: IconName;
    color: string;
    trend?: { value: number; isUp: boolean };
}

import { fetchDashboardStats, fetchRecentActivities, DashboardStats, RecentActivity } from '../../../services/adminStatsService';

/**
 * 统计仪表盘页面
 */
function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<RecentActivity[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [statsData, recentActivities] = await Promise.all([
                    fetchDashboardStats(),
                    fetchRecentActivities()
                ]);
                setDashboardData(statsData);
                setActivities(recentActivities);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    if (isLoading || !dashboardData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const stats: StatsCard[] = [
        {
            label: '总点位数',
            value: dashboardData.totalLineups,
            icon: 'MapPin',
            color: 'bg-blue-500/20 text-blue-400',
            trend: { value: dashboardData.trends.lineups, isUp: dashboardData.trends.lineups > 0 },
        },
        {
            label: '今日新增',
            value: dashboardData.todayNewLineups,
            icon: 'TrendingUp',
            color: 'bg-emerald-500/20 text-emerald-400',
            trend: { value: 5, isUp: true },
        },
        {
            label: '注册用户',
            value: dashboardData.totalUsers,
            icon: 'Users',
            color: 'bg-purple-500/20 text-purple-400',
            trend: { value: dashboardData.trends.users, isUp: dashboardData.trends.users > 0 },
        },
        {
            label: '今日下载',
            value: dashboardData.todayDownloads,
            icon: 'Download',
            color: 'bg-orange-500/20 text-orange-400',
            trend: { value: Math.abs(dashboardData.trends.downloads), isUp: dashboardData.trends.downloads > 0 },
        },
    ];

    return (
        <div className="flex gap-4 items-start h-[calc(100vh-100px)] overflow-hidden">
            {/* 左侧主内容区 - Flex 布局自动填充高度 */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden">
                {/* 统计卡片 - 固定高度 */}
                <div className="flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-[#1f2326] rounded-xl border border-white/10 p-3 flex items-center justify-between"
                        >
                            <div>
                                <div className="text-sm text-gray-400 mb-0.5">{stat.label}</div>
                                <div className="text-xl font-bold text-white flex items-baseline gap-2">
                                    {typeof stat.value === 'number'
                                        ? stat.value.toLocaleString()
                                        : stat.value}
                                    {stat.trend && (
                                        <span
                                            className={`flex items-center text-xs ${stat.trend.isUp ? 'text-emerald-400' : 'text-red-400'
                                                }`}
                                        >
                                            <Icon
                                                name={stat.trend.isUp ? 'TrendingUp' : 'TrendingDown'}
                                                size={10}
                                                className="mr-0.5"
                                            />
                                            {stat.trend.value}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`p-2 rounded-lg ${stat.color}`}>
                                <Icon name={stat.icon} size={18} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* 第一行图表 - 自动填充剩余高度的一半 */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <RetentionChart />
                    <StorageChart />
                </div>

                {/* 第二行图表 - 自动填充剩余高度的一半 */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <DailyDownloadsChart />
                    <ReviewStatsChart />
                </div>
            </div>

            {/* 右侧最近活动侧边栏 - 高度填满，内部滚动 */}
            <div className="w-80 shrink-0 hidden xl:block h-full">
                <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4 h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 flex-none">最近活动</h3>
                    <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-2">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0"
                            >
                                <div className="w-8 h-8 bg-[#ff4655]/20 rounded-full flex items-center justify-center shrink-0">
                                    <Icon name="Activity" size={14} className="text-[#ff4655]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm text-white">{activity.action}</div>
                                    <div className="text-xs text-gray-500 truncate">{activity.user}</div>
                                    <div className="text-xs text-gray-600 mt-1">{activity.time}</div>
                                </div>
                            </div>
                        ))}
                        {activities.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <Icon name="Activity" size={32} className="mb-2 opacity-20" />
                                <span className="text-sm">暂无最新活动</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;

