import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { adminSupabase } from '../../../../supabaseClient';

interface ReviewStats {
    week_label: string;
    approved_count: number;
    rejected_count: number;
}

export default function ReviewStatsChart() {
    const [data, setData] = useState<ReviewStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReviewStats() {
            try {
                const { data: stats, error } = await adminSupabase.rpc('get_weekly_review_stats');
                if (error) throw error;
                // Rename keys to match chart dataKey if needed, or just use raw
                // RPC returns: week_label, approved_count, rejected_count
                setData(stats || []);
            } catch (error) {
                console.error('Error fetching review stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchReviewStats();
    }, []);

    const totalApproved = data.reduce((sum, item) => sum + item.approved_count, 0);
    const totalRejected = data.reduce((sum, item) => sum + item.rejected_count, 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1f2326] border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-sm bg-opacity-90">
                    <p className="text-gray-400 text-xs mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-300">
                                {entry.name === '已通过' ? '通过' : '拒绝'}:
                            </span>
                            <span className="font-semibold text-white">
                                {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-none">
                <h3 className="text-sm font-semibold text-white">每周审核统计</h3>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-gray-400">通过 {totalApproved}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-gray-400">拒绝 {totalRejected}</span>
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-500">加载中...</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                            <defs>
                                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis
                                dataKey="week_label"
                                stroke="#6b7280"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                            <Bar
                                dataKey="approved_count"
                                name="已通过"
                                fill="url(#colorApproved)"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                                animationDuration={1500}
                            />
                            <Bar
                                dataKey="rejected_count"
                                name="已拒绝"
                                fill="url(#colorRejected)"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                                animationDuration={1500}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
