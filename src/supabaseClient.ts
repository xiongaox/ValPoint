/**
 * supabaseClient.ts - Supabase 客户端配置
 * 
 * 职责：
 * - 初始化主库 (Main DB) 和同步库 (Share DB) 的客户端实例
 * - 管理环境变量 (VITE_SUPABASE_*) 的读取与验证
 * - 为 Admin 后台创建独立的 Auth session
 */
import { createClient } from '@supabase/supabase-js';

// 优先读取运行时注入的环境变量 (Docker)，否则读取构建时变量 (Dev/Local)
const getEnv = (key: string) => {
  return window.__ENV__?.[key] || import.meta.env[key];
};

const url = getEnv('VITE_SUPABASE_URL');
const anonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const shareUrl = getEnv('VITE_SUPABASE_SHARE_URL') || url;
const shareAnonKey = getEnv('VITE_SUPABASE_SHARE_ANON_KEY') || anonKey;

if (!url || !anonKey) {
  throw new Error('请在环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}
if (!shareUrl || !shareAnonKey) {
  throw new Error('请在环境变量中设置 VITE_SUPABASE_SHARE_URL 和 VITE_SUPABASE_SHARE_ANON_KEY，或使用主库变量兜底');
}

// 主库客户端 - 用于个人库和共享库
export const supabase = createClient(url, anonKey);

// 同步库客户端
export const shareSupabase = createClient(shareUrl, shareAnonKey);

// Admin 后台专用客户端 - 使用独立的 storageKey 隔离 session
export const adminSupabase = createClient(url, anonKey, {
  auth: {
    storageKey: 'sb-admin-auth-token',
    storage: window.localStorage,
  },
});

