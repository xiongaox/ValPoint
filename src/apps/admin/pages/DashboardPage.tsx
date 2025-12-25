/**
 * DashboardPage - 管理后台概览页
 * 
 * 职责：
 * - 展示应用核心指标统计（点位总数、共享总数、用户总数、今日下载等）
 * - 渲染多维度的趋势图表 (Lineups, Users, Downloads)
 * - 提供快速审核入口指示
 */
import React, { useState, useEffect } from 'react';
import Icon, { IconName } from '../../../components/Icon';

interface StatsCard {
    label: string;
    value: number | string;
    icon: IconName;
    color: string;
    trend?: { value: number; isUp: boolean };
}

/**
 * 统计仪表盘页面
 */
function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<StatsCard[]>([]);

    useEffect(() => {
        // TODO: 从 Supabase 加载真实数据
        const mockStats: StatsCard[] = [
            {
                label: '总点位数',
                value: 1234,
                icon: 'MapPin',
                color: 'bg-blue-500/20 text-blue-400',
                trend: { value: 12, isUp: true },
            },
            {
                label: '今日新增',
                value: 23,
                icon: 'TrendingUp',
                color: 'bg-emerald-500/20 text-emerald-400',
                trend: { value: 5, isUp: true },
            },
            {
                label: '注册用户',
                value: 456,
                icon: 'Users',
                color: 'bg-purple-500/20 text-purple-400',
                trend: { value: 8, isUp: true },
            },
            {
                label: '今日下载',
                value: 89,
                icon: 'Download',
                color: 'bg-orange-500/20 text-orange-400',
                trend: { value: 3, isUp: false },
            },
        ];

        setTimeout(() => {
            setStats(mockStats);
            setIsLoading(false);
        }, 500);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-[#1f2326] rounded-xl border border-white/10 p-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <Icon name={stat.icon} size={20} />
                            </div>
                            {stat.trend && (
                                <div
                                    className={`flex items-center gap-1 text-xs ${stat.trend.isUp ? 'text-emerald-400' : 'text-red-400'
                                        }`}
                                >
                                    <Icon
                                        name={stat.trend.isUp ? 'TrendingUp' : 'TrendingDown'}
                                        size={12}
                                    />
                                    {stat.trend.value}%
                                </div>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {typeof stat.value === 'number'
                                ? stat.value.toLocaleString()
                                : stat.value}
                        </div>
                        <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* 图表区域占位 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1f2326] rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold mb-4">每周新增点位</h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Icon name="BarChart2" size={48} className="mx-auto mb-2 opacity-50" />
                            <span className="text-sm">图表功能即将上线</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1f2326] rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold mb-4">各特工点位分布</h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Icon name="PieChart" size={48} className="mx-auto mb-2 opacity-50" />
                            <span className="text-sm">图表功能即将上线</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 最近活动 */}
            <div className="bg-[#1f2326] rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4">最近活动</h3>
                <div className="space-y-3">
                    {[
                        { action: '上传了新点位', user: 'admin@example.com', time: '2 分钟前' },
                        { action: '用户注册', user: 'test@gmail.com', time: '15 分钟前' },
                        { action: '下载了点位包', user: 'user@qq.com', time: '1 小时前' },
                    ].map((activity, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#ff4655]/20 rounded-full flex items-center justify-center">
                                    <Icon name="Activity" size={14} className="text-[#ff4655]" />
                                </div>
                                <div>
                                    <div className="text-sm text-white">{activity.action}</div>
                                    <div className="text-xs text-gray-500">{activity.user}</div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
