/**
 * env.d - envd
 *
 * 职责：
 * - 声明envd相关的数据结构与类型约束。
 * - 为业务逻辑提供类型安全的契约。
 * - 集中管理跨模块共享的类型定义。
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
