/**
 * userProfile - 服务层
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
 * - `fetchUserSubscriptions`、`updateUserSubscriptions`
 *
 * 依赖关系：
 * - 上游依赖：`../supabaseClient`、`../apps/shared/logic/subscription`
 * - 下游影响：供 hooks/controllers 复用
 */

import { supabase } from '../supabaseClient';
import { Subscription } from '../apps/shared/logic/subscription';

export const fetchUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('subscriptions')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
    }

    return (data?.subscriptions as Subscription[]) || [];
};

export const updateUserSubscriptions = async (userId: string, subscriptions: Subscription[]) => {
    const { error } = await supabase
        .from('user_profiles')
        .update({ subscriptions })
        .eq('id', userId);

    if (error) {
        throw new Error('Failed to sync subscriptions to cloud');
    }
};
