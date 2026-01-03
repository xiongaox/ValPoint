/**
 * ui - ui
 *
 * 职责：
 * - 声明ui相关的数据结构与类型约束。
 * - 为业务逻辑提供类型安全的契约。
 * - 集中管理跨模块共享的类型定义。
 */

export type LightboxImage = string | { src: string; list?: string[]; index?: number; desc?: string; descList?: string[] };
