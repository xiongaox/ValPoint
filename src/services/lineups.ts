/**
 * lineups - 服务层
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

import { supabase } from '../supabaseClient';
import { TABLE } from './tables';
import { normalizeLineup } from './normalize';
import { BaseLineup, LineupDbPayload } from '../types/lineup';

export async function fetchLineupsApi(userId: string, mapNameZhToEn: Record<string, string>): Promise<BaseLineup[]> {
  const { data, error } = await supabase
    .from(TABLE.lineups)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((d) => normalizeLineup(d, mapNameZhToEn));
}

export async function saveLineupApi(payload: LineupDbPayload): Promise<BaseLineup> {
  const { data, error } = await supabase.from(TABLE.lineups).insert(payload).select().single();
  if (error) throw error;
  return normalizeLineup(data, {});
}

export async function updateLineupApi(id: string, payload: Partial<LineupDbPayload>) {
  const { error } = await supabase.from(TABLE.lineups).update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteLineupApi(id: string) {
  const { error } = await supabase.from(TABLE.lineups).delete().eq('id', id);
  if (error) throw error;
}

export async function findLineupByClone(userId: string, clonedFrom: string) {
  if (!userId || !clonedFrom) return null;
  const { data, error } = await supabase
    .from(TABLE.lineups)
    .select('id')
    .eq('user_id', userId)
    .eq('cloned_from', clonedFrom)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

export async function clearLineupsApi(userId: string) {
  const { error } = await supabase.from(TABLE.lineups).delete().eq('user_id', userId);
  if (error) throw error;
}

export async function clearLineupsByAgentApi(userId: string, agentName: string) {
  const { error } = await supabase.from(TABLE.lineups).delete().eq('user_id', userId).eq('agent_name', agentName);
  if (error) throw error;
}
