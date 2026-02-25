/**
 * DailyDownloadsChart - 应用壳层(admin)
 *
 * 模块定位：
 * - 所在层级：应用壳层(admin)
 * - 主要目标：承载管理后台流程与页面路由
 *
 * 关键职责：
 * - 聚焦界面渲染与交互事件回调
 * - 接收上层 props 并输出稳定 UI 行为
 * - 避免在组件中堆积跨模块业务逻辑
 *
 * 主要导出：
 * - `default:function`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`date-fns`、`../../../../supabaseClient`
 * - 下游影响：供 admin.html 入口挂载
 */

import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { adminSupabase } from '../../../../supabaseClient';

interface SupplyTrendPoint {
  date: string;
  displayDate: string;
  lineupCount: number;
  sharedCount: number;
}

const TREND_DAYS = 14;

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    keys.push(toLocalDateKey(current));
  }
  return keys;
}

export default function DailyDownloadsChart() {
  const [data, setData] = useState<SupplyTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplyTrends() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (TREND_DAYS - 1));
      start.setHours(0, 0, 0, 0);

      try {
        const [lineupsResult, sharedResult] = await Promise.all([
          adminSupabase
            .from('valorant_lineups')
            .select('created_at')
            .gte('created_at', start.toISOString()),
          adminSupabase
            .from('valorant_shared')
            .select('created_at')
            .gte('created_at', start.toISOString()),
        ]);

        if (lineupsResult.error) throw lineupsResult.error;
        if (sharedResult.error) throw sharedResult.error;

        const lineupCounts: Record<string, number> = {};
        const sharedCounts: Record<string, number> = {};

        lineupsResult.data?.forEach(item => {
          const key = toLocalDateKey(new Date(item.created_at));
          lineupCounts[key] = (lineupCounts[key] || 0) + 1;
        });

        sharedResult.data?.forEach(item => {
          const key = toLocalDateKey(new Date(item.created_at));
          sharedCounts[key] = (sharedCounts[key] || 0) + 1;
        });

        const trendData = getDateKeys(TREND_DAYS).map(dateKey => ({
          date: dateKey,
          displayDate: format(parseISO(dateKey), 'MM/dd'),
          lineupCount: lineupCounts[dateKey] || 0,
          sharedCount: sharedCounts[dateKey] || 0,
        }));

        setData(trendData);
      } catch (error) {
        console.error('Error fetching supply trends:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSupplyTrends();
  }, []);

  const totalLineups = data.reduce((sum, item) => sum + item.lineupCount, 0);
  const totalShared = data.reduce((sum, item) => sum + item.sharedCount, 0);

  return (
    <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-none">
        <h3 className="text-sm font-semibold text-white">内容供给趋势 (14天)</h3>
        <span className="text-xs text-gray-400">个人库 {totalLineups} / 共享库 {totalShared}</span>
      </div>
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">加载中...</div>
        ) : (
          <ResponsiveContainer width="99%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="displayDate" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2326',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                cursor={{ stroke: 'rgba(255, 255, 255, 0.18)', strokeWidth: 1 }}
                formatter={(value: number | string | undefined, name: string | undefined) => [
                  `${value ?? 0} 条`,
                  name || '数量',
                ]}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="lineupCount"
                name="个人库新增"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="sharedCount"
                name="共享库新增"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

