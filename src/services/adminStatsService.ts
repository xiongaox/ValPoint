/**
 * adminStatsService - 服务层
 *
 * 模块定位：
 * - 所在层级：服务层
 * - 主要目标：面向数据访问与结果归一化
 *
 * 关键职责：
 * - 对外提供可复用的数据访问函数
 * - 统一处理查询参数、字段映射与错误抛出
 * - 保证上层拿到稳定的数据结构
 *
 * 主要导出：
 * - `DashboardStats`、`RecentActivity`、`UserTrend`
 *
 * 依赖关系：
 * - 上游依赖：`../supabaseClient`、`./tables`
 * - 下游影响：供 hooks/controllers 复用
 */

import { supabase } from '../supabaseClient';
import { TABLE } from './tables';

export interface DashboardStats {
    totalLineups: number;
    todayNewLineups: number;
    totalUsers: number;
    todayDownloads: number;
    trends: {
        lineups: number;
        users: number;
        downloads: number;
    };
}

export interface RecentActivity {
    id: string;
    action: string;
    user: string;
    time: string;
    created_at: string;
}

function calculateTrend(current: number, previous: number): number {
    if (previous === 0) {
        return current > 0 ? 100 : 0; // 说明：上周为 0 时，增长显示 100%，无增长显示 0%。
    }
    return Math.round(((current - previous) / previous) * 100);
}

// 使用本地时区格式化日期为 YYYY-MM-DD
function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const dayOfWeek = now.getDay(); // 说明：0=周日，1=周一...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);

    const [
        { count: totalLineups },
        { count: totalUsers },
        { count: todayNewLineups },
        { data: downloadData }
    ] = await Promise.all([
        supabase.from(TABLE.shared).select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from(TABLE.shared).select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('download_logs').select('download_count').gte('created_at', todayStart)
    ]);

    const todayDownloads = downloadData?.reduce((acc, current) => acc + (current.download_count || 0), 0) || 0;

    const [
        { count: thisWeekLineups },
        { count: lastWeekLineups },
        { count: thisWeekUsers },
        { count: lastWeekUsers },
        { data: thisWeekDownloadsData },
        { data: lastWeekDownloadsData }
    ] = await Promise.all([
        supabase.from(TABLE.shared).select('*', { count: 'exact', head: true })
            .gte('created_at', thisWeekStart.toISOString()),
        supabase.from(TABLE.shared).select('*', { count: 'exact', head: true })
            .gte('created_at', lastWeekStart.toISOString())
            .lte('created_at', lastWeekEnd.toISOString()),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', thisWeekStart.toISOString()),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', lastWeekStart.toISOString())
            .lte('created_at', lastWeekEnd.toISOString()),
        supabase.from('download_logs').select('download_count')
            .gte('created_at', thisWeekStart.toISOString()),
        supabase.from('download_logs').select('download_count')
            .gte('created_at', lastWeekStart.toISOString())
            .lte('created_at', lastWeekEnd.toISOString())
    ]);

    const thisWeekDownloads = thisWeekDownloadsData?.reduce((acc, d) => acc + (d.download_count || 0), 0) || 0;
    const lastWeekDownloads = lastWeekDownloadsData?.reduce((acc, d) => acc + (d.download_count || 0), 0) || 0;

    return {
        totalLineups: totalLineups || 0,
        todayNewLineups: todayNewLineups || 0,
        totalUsers: totalUsers || 0,
        todayDownloads,
        trends: {
            lineups: calculateTrend(thisWeekLineups || 0, lastWeekLineups || 0),
            users: calculateTrend(thisWeekUsers || 0, lastWeekUsers || 0),
            downloads: calculateTrend(thisWeekDownloads, lastWeekDownloads)
        }
    };
}

export async function fetchRecentActivities(): Promise<RecentActivity[]> {
    const [
        { data: newUsers },
        { data: newLineups },
        { data: newDownloads },
        { data: newSubmissions }
    ] = await Promise.all([
        supabase.from('user_profiles').select('id, email, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from(TABLE.lineups).select('id, title, user_id, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('download_logs').select('id, user_email, lineup_title, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('lineup_submissions').select('id, title, submitter_email, status, created_at').order('created_at', { ascending: false }).limit(5)
    ]);

    const activities: RecentActivity[] = [];

    newUsers?.forEach(u => activities.push({
        id: `user-${u.id}`,
        action: '新用户注册',
        user: u.email || '未知用户',
        time: formatTimeAgo(u.created_at),
        created_at: u.created_at
    }));

    newLineups?.forEach(l => activities.push({
        id: `lineup-${l.id}`,
        action: `上传了新点位: ${l.title}`,
        user: '用户',
        time: formatTimeAgo(l.created_at),
        created_at: l.created_at
    }));

    newDownloads?.forEach(d => activities.push({
        id: `download-${d.id}`,
        action: `下载了点位: ${d.lineup_title}`,
        user: d.user_email || '匿名用户',
        time: formatTimeAgo(d.created_at),
        created_at: d.created_at
    }));

    newSubmissions?.forEach(s => activities.push({
        id: `sub-${s.id}`,
        action: `新投稿: ${s.title} (${s.status === 'pending' ? '待审核' : s.status})`,
        user: s.submitter_email || '未知',
        time: formatTimeAgo(s.created_at),
        created_at: s.created_at
    }));

    return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
}

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '刚刚';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
    return `${Math.floor(diffInSeconds / 86400)} 天前`;
}

export interface UserTrend {
    date: string;
    count: number;
}

export async function fetchUserGrowthTrends(): Promise<UserTrend[]> {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

    if (error) {
        console.error('Error fetching user growth:', error);
        return [];
    }

    const trends: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dateStr = formatLocalDate(d);
        trends[dateStr] = 0;
    }

    data?.forEach(u => {
        const dateStr = formatLocalDate(new Date(u.created_at));
        if (trends[dateStr] !== undefined) {
            trends[dateStr]++;
        }
    });

    return Object.entries(trends)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchLineupGrowthTrends(): Promise<UserTrend[]> {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from(TABLE.shared)
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

    if (error) {
        console.error('Error fetching lineup growth:', error);
        return [];
    }

    const trends: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dateStr = formatLocalDate(d);
        trends[dateStr] = 0;
    }

    data?.forEach(l => {
        const dateStr = formatLocalDate(new Date(l.created_at));
        if (trends[dateStr] !== undefined) {
            trends[dateStr]++;
        }
    });

    return Object.entries(trends)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
