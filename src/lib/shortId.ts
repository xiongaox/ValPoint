/**
 * shortId - 基础库
 *
 * 模块定位：
 * - 所在层级：基础库
 * - 主要目标：提供通用工具能力与系统辅助逻辑
 *
 * 关键职责：
 * - 提供与框架解耦的通用能力函数
 * - 处理下载、导入、校验、系统配置等基础逻辑
 * - 为业务层提供可组合的底层能力
 *
 * 主要导出：
 * - `generateShortId`
 *
 * 依赖关系：
 * - 上游依赖：`../supabaseClient`
 * - 下游影响：供 hooks/features/services 复用
 */

import { supabase } from '../supabaseClient';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_LENGTH = 8;

export function generateShortId(length = DEFAULT_LENGTH): string {
    let result = '';
    const arr = crypto.getRandomValues(new Uint32Array(length));
    for (let i = 0; i < length; i++) {
        result += CHARS[arr[i] % CHARS.length];
    }
    return result;
}


export async function generateUniqueId(): Promise<string> {
    const MAX_ATTEMPTS = 5;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const newId = generateShortId();

        const { data, error } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('custom_id', newId)
            .maybeSingle();

        if (error) {
            console.error('查询 custom_id 失败:', error);
            return newId;
        }

        if (!data) {
            return newId;
        }

        console.warn(`生成的 ID ${newId} 已存在，重试中 (${attempt + 1}/${MAX_ATTEMPTS})`);
    }

    return generateShortId();
}
