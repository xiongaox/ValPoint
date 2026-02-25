/**
 * shared - 服务层
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
 * - 当前文件以内部实现为主（无显式导出或仅默认匿名导出）
 *
 * 依赖关系：
 * - 上游依赖：`../supabaseClient`、`./tables`、`./normalize`、`../types/lineup`
 * - 下游影响：供 hooks/controllers 复用
 */

import { shareSupabase } from '../supabaseClient';
import { TABLE } from './tables';
import { normalizeLineup } from './normalize';
import { BaseLineup, SharedLineup } from '../types/lineup';

export async function fetchSharedById(id: string, mapNameZhToEn: Record<string, string>): Promise<SharedLineup | null> {
  const { data: sharedData, error: sharedError } = await shareSupabase
    .from(TABLE.shared)
    .select('*')
    .eq('id', id)
    .single();

  if (sharedError || !sharedData) {
    return null;
  }

  const normalized = normalizeLineup(sharedData, mapNameZhToEn);
  return { ...normalized, id: sharedData.id, sourceId: sharedData.source_id };
}

import { SupabaseClient } from '@supabase/supabase-js';

export async function fetchSharedList(mapNameZhToEn: Record<string, string>, client: SupabaseClient = shareSupabase): Promise<BaseLineup[]> {
  const { data, error } = await client.from(TABLE.shared).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((d) => normalizeLineup(d, mapNameZhToEn));
}

export async function upsertShared(payload: any) {
  const { error } = await shareSupabase.from(TABLE.shared).upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}
