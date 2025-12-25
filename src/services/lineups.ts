/**
 * lineups 服务 - 个人库点位数据访问层
 * 
 * 封装对 Supabase valorant_lineups 表的 CRUD 操作：
 * - fetchLineupsApi: 查询用户的所有点位
 * - saveLineupApi: 新增点位
 * - updateLineupApi: 更新点位
 * - deleteLineupApi: 删除单个点位
 * - clearLineupsApi: 清空用户所有点位
 * - clearLineupsByAgentApi: 清空用户某特工的点位
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
