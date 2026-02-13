/**
 * StorageChart - 管理端地图热度分布图表
 *
 * 职责：
 * - 渲染近30天地图热度分布（上传/下载）图表。
 */

import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminSupabase } from '../../../../supabaseClient';
import { MAP_TRANSLATIONS } from '../../../../constants/maps';

interface MapHeatPoint {
  mapName: string;
  uploadCount: number;
  downloadCount: number;
  total: number;
}

const WINDOW_DAYS = 30;
const MAX_MAPS = 8;

function getMapDisplayName(mapName: string): string {
  return MAP_TRANSLATIONS[mapName] || mapName;
}

export default function StorageChart() {
  const [data, setData] = useState<MapHeatPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMapHeat() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (WINDOW_DAYS - 1));
      start.setHours(0, 0, 0, 0);

      try {
        const [lineupsResult, sharedResult, downloadsResult] = await Promise.all([
          adminSupabase
            .from('valorant_lineups')
            .select('map_name')
            .gte('created_at', start.toISOString()),
          adminSupabase
            .from('valorant_shared')
            .select('map_name')
            .gte('created_at', start.toISOString()),
          adminSupabase
            .from('download_logs')
            .select('map_name, download_count')
            .gte('created_at', start.toISOString()),
        ]);

        if (lineupsResult.error) throw lineupsResult.error;
        if (sharedResult.error) throw sharedResult.error;
        if (downloadsResult.error) throw downloadsResult.error;

        const uploadMap: Record<string, number> = {};
        const downloadMap: Record<string, number> = {};

        lineupsResult.data?.forEach(item => {
          const key = item.map_name || '未知地图';
          uploadMap[key] = (uploadMap[key] || 0) + 1;
        });

        sharedResult.data?.forEach(item => {
          const key = item.map_name || '未知地图';
          uploadMap[key] = (uploadMap[key] || 0) + 1;
        });

        downloadsResult.data?.forEach(item => {
          const key = item.map_name || '未知地图';
          const count = item.download_count || 0;
          downloadMap[key] = (downloadMap[key] || 0) + count;
        });

        const keys = Array.from(new Set([...Object.keys(uploadMap), ...Object.keys(downloadMap)]));
        const merged = keys.map(key => {
          const uploadCount = uploadMap[key] || 0;
          const downloadCount = downloadMap[key] || 0;

          return {
            mapName: key,
            uploadCount,
            downloadCount,
            total: uploadCount + downloadCount,
          };
        });

        merged.sort((a, b) => b.total - a.total);
        setData(merged.slice(0, MAX_MAPS));
      } catch (error) {
        console.error('Error fetching map heat stats:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMapHeat();
  }, []);

  const totalUploads = data.reduce((sum, item) => sum + item.uploadCount, 0);
  const totalDownloads = data.reduce((sum, item) => sum + item.downloadCount, 0);

  return (
    <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-none">
        <h3 className="text-sm font-semibold text-white">地图热度分布 (30天)</h3>
        <span className="text-xs text-gray-400">上传 {totalUploads} / 下载 {totalDownloads}</span>
      </div>
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">加载中...</div>
        ) : (
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis
                dataKey="mapName"
                stroke="#666"
                fontSize={12}
                interval={0}
                tickFormatter={(value: string | number) => getMapDisplayName(String(value))}
              />
              <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2326',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.06)' }}
                formatter={(value: number | string | undefined, name: string | undefined) => [
                  `${value ?? 0} 次`,
                  name || '数量',
                ]}
                labelFormatter={(label: string | number) => getMapDisplayName(String(label))}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar
                dataKey="uploadCount"
                name="上传量"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
              <Bar
                dataKey="downloadCount"
                name="下载量"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

