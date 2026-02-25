/**
 * valpoint.json - 函数入口层
 *
 * 模块定位：
 * - 所在层级：函数入口层
 * - 主要目标：承载函数运行时入口与配置输出
 *
 * 关键职责：
 * - 维护函数入口与运行时输出
 * - 对接部署环境约束
 * - 保证运行时配置格式稳定
 *
 * 主要导出：
 * - 当前文件以内部实现为主（无显式导出或仅默认匿名导出）
 *
 * 依赖关系：
 * - 上游依赖：`../valpoint.config.js`
 * - 下游影响：供 serverless 环境调用
 */

import { manifestConfig } from '../valpoint.config.js';

export async function onRequest(context) {
    const { env } = context;

    const data = {
        ...manifestConfig,
        description: `${manifestConfig.description} (Cloudflare)`,
        api: {
            supabaseUrl: env.VITE_SUPABASE_URL || env.SUPABASE_URL,
            supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
        }
    };

    return new Response(JSON.stringify(data), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
