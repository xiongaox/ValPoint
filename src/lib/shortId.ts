/**
 * shortId - 唯一短 ID 生成服务
 * 
 * 职责：
 * - 生成用户可读的、排除混淆字符的短 ID（如 ABC-8位）
 * - 确保 ID 在 `user_profiles` 表中的全局唯一性
 */

import { supabase } from '../supabaseClient';

// Base32 变体字符集（排除 I, 1, O, 0）
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_LENGTH = 8;

/**
 * 生成指定长度的随机短 ID
 * @param length ID 长度，默认 8 位
 * @returns 随机 ID 字符串
 */
export function generateShortId(length = DEFAULT_LENGTH): string {
    let result = '';
    const arr = crypto.getRandomValues(new Uint32Array(length));
    for (let i = 0; i < length; i++) {
        result += CHARS[arr[i] % CHARS.length];
    }
    return result;
}


/**
 * 生成全局唯一的短 ID
 * 通过查询数据库确保不重复
 * @returns Promise<string> 唯一的短 ID
 */
export async function generateUniqueId(): Promise<string> {
    const MAX_ATTEMPTS = 5;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const newId = generateShortId();

        // 查询数据库确认是否已存在
        const { data, error } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('custom_id', newId)
            .maybeSingle();

        if (error) {
            console.error('查询 custom_id 失败:', error);
            // 发生错误时仍返回生成的 ID，依赖数据库唯一约束
            return newId;
        }

        if (!data) {
            // 未找到重复，可用
            return newId;
        }

        // 找到重复，继续下一次尝试
        console.warn(`生成的 ID ${newId} 已存在，重试中 (${attempt + 1}/${MAX_ATTEMPTS})`);
    }

    // 极端情况：多次尝试都失败，返回最后生成的 ID
    // 依赖数据库唯一约束作为最终保障
    return generateShortId();
}
