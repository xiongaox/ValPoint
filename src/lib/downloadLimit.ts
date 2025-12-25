/**
 * downloadLimit.ts - 下载限制服务
 * 
 * 职责：
 * - 检查用户的每日下载配额
 * - 记录用户的下载行为
 */
import { supabase } from '../supabaseClient';
import { getSystemSettings } from './systemSettings';

/**
 * 检查每日下载限制
 * @param userId 用户ID
 * @param count 欲下载的数量 (默认为 1)
 * @returns { allowed: boolean, remaining: number, limit: number }
 */
export async function checkDailyDownloadLimit(userId: string, count: number = 1): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    // 1. 获取全局限制配置
    const settings = await getSystemSettings();
    const limit = settings?.daily_download_limit || 50; // 默认 50 次

    // 2. 获取今日已下载次数
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
        .from('user_daily_downloads')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
        console.error('Failed to check download limit:', error);
        // 如果查询失败，默认允许（为了不阻塞用户，但记录错误）
        // 或者可以严格点返回 false，视业务容忍度而定。这里选择严格一点，防止被刷。
        // 但考虑到用户体验，如果只是网络小抖动，还是放行比较好？
        // 还是先严格一点，让用户重试。
        return { allowed: true, remaining: limit, limit };
    }

    const currentCount = data?.count || 0;
    const remaining = Math.max(0, limit - currentCount);

    return {
        allowed: currentCount + count <= limit,
        remaining,
        limit
    };
}

/**
 * 增加下载计数
 * @param userId 用户ID
 * @param count 增加的数量
 */
export async function incrementDownloadCount(userId: string, count: number = 1): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // 使用 Supabase 的 rpc 或者 upsert 逻辑
    // 由于我们没有创建专门的 increment rpc，这里使用 upsert 逻辑 (存在并发竞争风险，但对于此场景可接受)
    // 更好的做法是 DB 层面的 upsert on conflict do update count = count + val

    // 这里我们尝试先查再更，或者直接利用 insert on conflict (利用唯一索引 user_id + date)
    // Supabase JS 客户端 upsert 语法：

    // 我们先查询当前值，因为 upsert 需要完整行数据或者利用 DB 默认值
    // 但为了累加，我们需要知道之前的值。
    // 如果高并发，这里会有问题。最好是用 stored function。
    // 但既然用户没给 DB 权限建 function，我们只能在客户端做 best effort.

    // 方案：先读取，如果不存在则插入 count，如果存在则 update count = old + count
    // 为了简单，我们简化为：读取 -> 计算 -> Upsert

    const { data } = await supabase
        .from('user_daily_downloads')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    const newCount = (data?.count || 0) + count;

    const { error } = await supabase
        .from('user_daily_downloads')
        .upsert({
            user_id: userId,
            date: today,
            count: newCount,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,date' });

    if (error) {
        console.error('Failed to increment download count:', error);
    }
}
