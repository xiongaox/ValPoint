/**
 * shared 服务 - 共享库点位数据访问层
 * 
 * 封装对 Supabase valorant_shared 表的操作：
 * - fetchSharedById: 根据分享ID获取单个共享点位
 * - fetchSharedList: 获取所有共享点位列表
 * - upsertShared: 创建或更新共享点位（用于分享功能）
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

export async function fetchSharedList(mapNameZhToEn: Record<string, string>): Promise<BaseLineup[]> {
  const { data, error } = await shareSupabase.from(TABLE.shared).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((d) => normalizeLineup(d, mapNameZhToEn));
}

export async function upsertShared(payload: any) {
  // 使用 id 作为冲突检测键
  const { error } = await shareSupabase.from(TABLE.shared).upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}
