/**
 * supabaseClient.ts - Supabase 客户端配置
 * 
 * 职责：
 * - 初始化主库 (Main DB) 和同步库 (Share DB) 的客户端实例
 * - 管理环境变量 (VITE_SUPABASE_*) 的读取与验证
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const shareUrl = import.meta.env.VITE_SUPABASE_SHARE_URL || url;
const shareAnonKey = import.meta.env.VITE_SUPABASE_SHARE_ANON_KEY || anonKey;

if (!url || !anonKey) {
  throw new Error('请在环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}
if (!shareUrl || !shareAnonKey) {
  throw new Error('请在环境变量中设置 VITE_SUPABASE_SHARE_URL 和 VITE_SUPABASE_SHARE_ANON_KEY，或使用主库变量兜底');
}

export const supabase = createClient(url, anonKey);
export const shareSupabase = createClient(shareUrl, shareAnonKey);
