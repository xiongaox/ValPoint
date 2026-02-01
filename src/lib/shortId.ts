/**
 * shortId - 占位模块（本地版本）
 * 简单的短ID生成
 */

export function generateShortId(): string {
    return Math.random().toString(36).substring(2, 10);
}

export function parseShortId(id: string): string {
    return id;
}
