/**
 * env.d - 类型层
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
 * - 当前文件以内部实现为主（无显式导出或仅默认匿名导出）
 *
 * 依赖关系：
 * - 上游依赖：无显式外部模块依赖
 * - 下游影响：供全局编译期约束
 */

export { };

declare global {
    interface Window {
        __ENV__: {
            VITE_SUPABASE_URL: string;
            VITE_SUPABASE_ANON_KEY: string;
            VITE_SHARED_LIBRARY_URL?: string;
            VITE_ICP_NUMBER?: string;
            VITE_PSB_NUMBER?: string;
            VITE_COPYRIGHT_TEXT?: string;
            VITE_DEPLOY_PLATFORM?: string;

            [key: string]: string | undefined;
        };
    }
}
