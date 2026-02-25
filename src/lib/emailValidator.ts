/**
 * emailValidator - 基础库
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
 * - `EmailValidationResult`、`validateEmail`、`getAllowedDomains`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供 hooks/features/services 复用
 */

const ALLOWED_DOMAINS = [
    'gmail.com',
    'qq.com',
    'foxmail.com',
    '163.com',
    '126.com',
    'yeah.net',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'sina.com',
    'sina.cn',
    'sohu.com',
    'yahoo.com',
    'yahoo.cn',
    'icloud.com',
    'me.com',
    'mail.com',
    'protonmail.com',
    'zoho.com',
];

export interface EmailValidationResult {
    isValid: boolean;
    error?: string;
}

export function validateEmail(email: string): EmailValidationResult {


    const devBypassEmail = import.meta.env.VITE_DEV_BYPASS_EMAIL;
    if (devBypassEmail && email.toLowerCase() === devBypassEmail.toLowerCase()) {
        return { isValid: true };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            error: '请输入有效的邮箱地址',
        };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
        return {
            isValid: false,
            error: '邮箱格式不正确',
        };
    }

    if (!ALLOWED_DOMAINS.includes(domain)) {
        return {
            isValid: false,
            error: '仅支持主流邮箱（如 Gmail、QQ、163、Outlook 等）',
        };
    }

    return { isValid: true };
}

export function getAllowedDomains(): string[] {
    return [...ALLOWED_DOMAINS];
}
