/**
 * valpoint - API 适配层
 *
 * 模块定位：
 * - 所在层级：API 适配层
 * - 主要目标：承载边缘 API/接口适配实现
 *
 * 关键职责：
 * - 处理平台侧请求入口与响应格式
 * - 封装外部访问到内部逻辑的适配
 * - 确保部署目标下行为可预期
 *
 * 主要导出：
 * - `default:function`
 *
 * 依赖关系：
 * - 上游依赖：`../valpoint.config.js`
 * - 下游影响：供部署平台调用
 */

import { manifestConfig } from '../valpoint.config.js';

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    res.status(200).json({
        ...manifestConfig,
        description: `${manifestConfig.description} (Vercel)`,
        api: {
            supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
            supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
        }
    });
}
