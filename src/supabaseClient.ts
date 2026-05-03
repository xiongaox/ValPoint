/**
 * supabaseClient - supabaseClient
 *
 * 职责：
 * - 承载supabaseClient相关的模块实现。
 * - 组织内部依赖与导出接口。
 * - 为上层功能提供支撑。
 */

import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  return window.__ENV__?.[key] || import.meta.env[key];
};

export const supabaseUrl = getEnv('VITE_SUPABASE_URL');

// 兼容阿里云 ESA 200字符限制：优先使用完整 key，否则合并拆分的 key
export const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY')
  || ((getEnv('VITE_SUPABASE_ANON_KEY_1') || '') + (getEnv('VITE_SUPABASE_ANON_KEY_2') || ''));

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('请在环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY（或 KEY_1 + KEY_2）');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 共享库现统一使用主库配置
export const shareSupabase = createClient(supabaseUrl, supabaseAnonKey);

export const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'sb-admin-auth-token',
    storage: window.localStorage,
  },
});
