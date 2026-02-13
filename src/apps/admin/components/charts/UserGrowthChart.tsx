/**
 * UserGrowthChart - 管理端增长趋势图表
 *
 * 职责：
 * - 渲染管理端用户和点位增长趋势图表。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { fetchUserGrowthTrends, fetchLineupGrowthTrends, UserTrend } from '../../../../services/adminStatsService';
import { format, parseISO } from 'date-fns';

interface CombinedTrend {
    date: string;
    displayDate: string;
    userCount: number;
    lineupCount: number;
}

export default function UserGrowthChart() {
    const [data, setData] = useState<CombinedTrend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [userTrends, lineupTrends] = await Promise.all([
                    fetchUserGrowthTrends(),
                    fetchLineupGrowthTrends()
                ]);

                // 合并两个数据源
                const combined: CombinedTrend[] = userTrends.map(ut => {
                    const lt = lineupTrends.find(l => l.date === ut.date);
                    return {
                        date: ut.date,
                        displayDate: format(parseISO(ut.date), 'MM/dd'),
                        userCount: ut.count,
                        lineupCount: lt?.count || 0
                    };
                });
                setData(combined);
            } catch (err) {
                console.error('Failed to load growth data', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-none">
                <h3 className="text-sm font-semibold text-white">增长趋势 (7天)</h3>
            </div>
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-500">加载中...</div>
                ) : (
                    <ResponsiveContainer width="99%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="displayDate" stroke="#666" fontSize={12} />
                            <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2326',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                }}
                                cursor={{ stroke: 'rgba(255, 255, 255, 0.18)', strokeWidth: 1 }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="userCount"
                                name="新增用户"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="lineupCount"
                                name="新增点位"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981', strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
