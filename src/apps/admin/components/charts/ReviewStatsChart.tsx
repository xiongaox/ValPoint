/**
 * ReviewStatsChart - 管理端个人库贡献榜图表
 *
 * 职责：
 * - 渲染近30天个人库贡献者上传活跃榜（Top8）。
 * - 以 user_profiles 的 custom_id/nickname/email 作为展示名，便于管理员识别用户。
 */

import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { adminSupabase } from '../../../../supabaseClient';

interface ContributorPoint {
  contributor: string;
  uploadCount: number;
}

interface LineupRecord {
  user_id: string | null;
  creator_id: string | null;
  author_uid: string | null;
  author_name: string | null;
}

interface UserProfileLite {
  id: string;
  custom_id: string | null;
  nickname: string | null;
  email: string | null;
}

const WINDOW_DAYS = 30;
const TOP_N = 8;

function toUserLabel(profile: UserProfileLite): string {
  if (profile.custom_id) return profile.custom_id;
  if (profile.nickname) return profile.nickname;
  if (profile.email) return profile.email.split('@')[0];
  return profile.id.slice(0, 8);
}

function normalizeFallback(record: LineupRecord): string {
  const creatorId = record.creator_id?.trim();
  if (creatorId) return creatorId;

  const authorUid = record.author_uid?.trim();
  if (authorUid) return authorUid;

  const authorName = record.author_name?.trim();
  if (authorName) return authorName;

  return '未知贡献者';
}

function formatContributorLabel(value: string): string {
  if (value.length <= 12) return value;
  return `${value.slice(0, 10)}...`;
}

export default function ReviewStatsChart() {
  const [data, setData] = useState<ContributorPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContributorRanking() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (WINDOW_DAYS - 1));
      start.setHours(0, 0, 0, 0);

      try {
        const lineupsResult = await adminSupabase
          .from('valorant_lineups')
          .select('user_id, creator_id, author_uid, author_name')
          .gte('created_at', start.toISOString());

        if (lineupsResult.error) throw lineupsResult.error;

        const rows = (lineupsResult.data || []) as LineupRecord[];
        const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[];

        const userIdToLabel: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await adminSupabase
            .from('user_profiles')
            .select('id, custom_id, nickname, email')
            .in('id', userIds);
          if (profilesError) throw profilesError;

          (profiles as UserProfileLite[] | null)?.forEach(p => {
            userIdToLabel[p.id] = toUserLabel(p);
          });
        }

        const contributorMap: Record<string, number> = {};
        rows.forEach(r => {
          const key = r.user_id ? (userIdToLabel[r.user_id] || r.user_id.slice(0, 8)) : normalizeFallback(r);
          contributorMap[key] = (contributorMap[key] || 0) + 1;
        });

        const ranking = Object.entries(contributorMap)
          .map(([contributor, uploadCount]) => ({ contributor, uploadCount }))
          .sort((a, b) => b.uploadCount - a.uploadCount)
          .slice(0, TOP_N);

        setData(ranking);
      } catch (error) {
        console.error('Error fetching contributor ranking:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchContributorRanking();
  }, []);

  const totalUploads = data.reduce((sum, item) => sum + item.uploadCount, 0);

  return (
    <div className="bg-[#1f2326] rounded-xl border border-white/10 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-none">
        <h3 className="text-sm font-semibold text-white">个人库贡献榜 (30天)</h3>
        <span className="text-xs text-gray-400">Top{TOP_N} 共 {totalUploads} 条</span>
      </div>
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">加载中...</div>
        ) : (
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="contributor" stroke="#666" fontSize={11} tickFormatter={formatContributorLabel} interval={0} />
              <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2326',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.06)' }}
                formatter={(value: number | string | undefined) => [`${value ?? 0} 条`, '上传量']}
                labelStyle={{ color: '#fff' }}
              />
              <Bar
                dataKey="uploadCount"
                name="上传量"
                fill="#ff4655"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

