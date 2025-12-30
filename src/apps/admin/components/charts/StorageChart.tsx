/**
 * StorageChart - 存储空间占用饼状图
 */
import React, { useEffect, useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { adminSupabase } from '../../../../supabaseClient';

interface StorageStats {
    totalBytes: number;
    breakdown: Array<{
        category: string;
        size: number;
    }>;
}

const COLORS: Record<string, string> = {
    'Image': '#ff4655',
    'Video': '#3b82f6',
    'Audio': '#10b981',
    'Other': '#6b7280'
};

// Supabase Free Plan limit is typically 1GB
const STORAGE_LIMIT_GB = 1;

export default function StorageChart() {
    const [stats, setStats] = useState<StorageStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStorageStats() {
            try {
                const { data, error } = await adminSupabase.rpc('get_storage_stats');
                if (error) throw error;
                setStats(data as StorageStats);
            } catch (error) {
                console.error('Error fetching storage stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStorageStats();
    }, []);

    if (loading) {
        return (
            <div className="bg-[#1f2326] rounded-xl border border-white/10 p-6 h-[340px] flex items-center justify-center">
                <div className="text-gray-400">Loading storage stats...</div>
            </div>
        );
    }

    // Convert to GB for display
    const totalUsedGB = stats ? (stats.totalBytes / (1024 * 1024 * 1024)) : 0;
    const freeGB = Math.max(0, STORAGE_LIMIT_GB - totalUsedGB);
    const usagePercent = Math.min(100, (totalUsedGB / STORAGE_LIMIT_GB) * 100).toFixed(1);

    const chartData = [
        { name: '已用空间', value: totalUsedGB, color: '#ff4655' },
        { name: '剩余空间', value: freeGB, color: '#333333' }
    ];

    return (
        <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-none">
                <h3 className="text-sm font-semibold text-white">存储空间占用</h3>
                <span className="text-xs text-gray-400">{totalUsedGB.toFixed(2)} GB / {STORAGE_LIMIT_GB} GB</span>
            </div>
            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            <linearGradient id="colorUsed" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#ff4655" />
                                <stop offset="100%" stopColor="#ff8f9a" />
                            </linearGradient>
                        </defs>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="90%"
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                        >
                            <Cell key="cell-used" fill="url(#colorUsed)" />
                            <Cell key="cell-free" fill="#333333" />
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2326',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                            }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any) => [`${Number(value).toFixed(3)} GB`]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white">{usagePercent}%</span>
                    <span className="text-xs text-gray-500">已使用</span>
                </div>
            </div>
        </div>
    );
}
