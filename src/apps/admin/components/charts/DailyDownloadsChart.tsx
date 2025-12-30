/**
 * DailyDownloadsChart - 每日下载趋势图
 */
import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { adminSupabase } from '../../../../supabaseClient';
import { format, parseISO } from 'date-fns';

interface DownloadTrend {
    download_date: string;
    count: number;
}

export default function DailyDownloadsChart() {
    const [data, setData] = useState<DownloadTrend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTrends() {
            try {
                const { data: trends, error } = await adminSupabase.rpc('get_daily_download_trends');
                if (error) throw error;

                // Format dates for display (e.g., "12/29")
                const formattedData = (trends as DownloadTrend[]).map(item => ({
                    ...item,
                    displayDate: format(parseISO(item.download_date), 'MM/dd')
                }));

                setData(formattedData);
            } catch (error) {
                console.error('Error fetching download trends:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchTrends();
    }, []);

    const totalDownloads = data.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-none">
                <h3 className="text-sm font-semibold text-white">下载趋势 (近7天)</h3>
                <span className="text-xs text-gray-400">本周共 {totalDownloads} 次</span>
            </div>
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-500">加载中...</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                stroke="#666"
                                fontSize={12}
                            />
                            <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2326',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                }}
                                formatter={(value) => [`${value} 次`, '下载量']}
                                labelStyle={{ color: '#fff' }}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#ff4655"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
