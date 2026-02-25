/**
 * authorLinks - 类型层
 *
 * 模块定位：
 * - 所在层级：类型层
 * - 主要目标：集中定义跨模块共享类型
 *
 * 关键职责：
 * - 定义稳定的类型契约与字段语义
 * - 减少跨模块调用歧义
 * - 提升重构与联调时的可预期性
 *
 * 主要导出：
 * - `AuthorLinks`、`defaultAuthorLinks`
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供全局编译期约束
 */

export interface AuthorLinks {
    github_url: string;
    tutorial_url: string;
    donate_wechat_qr: string;
    donate_alipay_qr: string;
    contact_wechat_qr: string;
}

export const defaultAuthorLinks: AuthorLinks = {
    github_url: '',
    tutorial_url: '',
    donate_wechat_qr: '',
    donate_alipay_qr: '',
    contact_wechat_qr: '',
};
