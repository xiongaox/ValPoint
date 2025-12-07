import { shareSupabase, supabase } from '../supabaseClient';
import { TABLE } from './tables';
import { normalizeLineup } from './normalize';

export async function fetchSharedByShareId(shareId: string, mapNameZhToEn: Record<string, string>) {
  const { data: sharedData, error: sharedError } = await shareSupabase
    .from(TABLE.shared)
    .select('*')
    .eq('share_id', shareId)
    .single();
  if (!sharedError && sharedData) {
    const normalized = normalizeLineup(sharedData, mapNameZhToEn);
    return { ...normalized, id: sharedData.source_id || sharedData.id || shareId, shareId: sharedData.share_id || shareId };
  }
  const { data: legacyData, error: legacyError } = await supabase.from(TABLE.lineups).select('*').eq('id', shareId).single();
  if (!legacyError && legacyData) {
    const normalized = normalizeLineup(legacyData, mapNameZhToEn);
    return { ...normalized, id: legacyData.id, shareId: shareId };
  }
  return null;
}

export async function fetchSharedList(mapNameZhToEn: Record<string, string>) {
  const { data, error } = await shareSupabase.from(TABLE.shared).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((d) => normalizeLineup(d, mapNameZhToEn));
}

export async function upsertShared(payload: any) {
  const { error } = await shareSupabase.from(TABLE.shared).upsert(payload, { onConflict: 'share_id' });
  if (error) throw error;
}
