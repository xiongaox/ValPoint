import { supabase } from '../supabaseClient';
import { TABLE } from './tables';

export async function fetchUserApi(userId: string) {
  return supabase.from(TABLE.users).select('password, created_at').eq('user_id', userId);
}

export async function upsertUserApi(payload: any) {
  return supabase.from(TABLE.users).upsert(payload);
}
