/**
 * emailValidator - emailValidator
 *
 * 职责：
 * - 承载emailValidator相关的模块实现。
 * - 组织内部依赖与导出接口。
 * - 为上层功能提供支撑。
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

