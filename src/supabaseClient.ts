/**
 * supabaseClient - 应用源码层
 *
 * 模块定位：
 * - 所在层级：应用源码层
 * - 主要目标：承载前端运行时主逻辑
 *
 * 关键职责：
 * - 承载当前文件的核心实现逻辑
 * - 处理输入输出与边界行为
 * - 向上层提供稳定可复用能力
 *
 * 主要导出：
 * - `supabase`、`shareSupabase`、`adminSupabase`
 *
 * 依赖关系：
 * - 上游依赖：`@supabase/supabase-js`
 * - 下游影响：供 MPA 入口启动
 */

import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  return window.__ENV__?.[key] || import.meta.env[key];
};

const url = getEnv('VITE_SUPABASE_URL');

// 兼容阿里云 ESA 200字符限制：优先使用完整 key，否则合并拆分的 key
const anonKey = getEnv('VITE_SUPABASE_ANON_KEY')
  || ((getEnv('VITE_SUPABASE_ANON_KEY_1') || '') + (getEnv('VITE_SUPABASE_ANON_KEY_2') || ''));

if (!url || !anonKey) {
  throw new Error('请在环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY（或 KEY_1 + KEY_2）');
}

export const supabase = createClient(url, anonKey);

// 共享库现统一使用主库配置
export const shareSupabase = createClient(url, anonKey);

export const adminSupabase = createClient(url, anonKey, {
  auth: {
    storageKey: 'sb-admin-auth-token',
    storage: window.localStorage,
  },
});
