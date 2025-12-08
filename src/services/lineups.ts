import { supabase } from '../supabaseClient';
import { TABLE } from './tables';
import { normalizeLineup } from './normalize';

export async function fetchLineupsApi(userId: string, mapNameZhToEn: Record<string, string>) {
  const { data, error } = await supabase
    .from(TABLE.lineups)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((d) => normalizeLineup(d, mapNameZhToEn));
}

export async function saveLineupApi(payload: any) {
  const { error } = await supabase.from(TABLE.lineups).insert(payload);
  if (error) throw error;
}

export async function updateLineupApi(id: string, payload: any) {
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
