/**
 * useEmailAuth - 占位模块（本地版本）
 * 本地化版本不需要邮箱认证，此模块提供模拟数据
 */

export interface LocalUser {
    id: string;
    email: string;
    app_metadata: Record<string, any>;
    aud: string;
    created_at: string;
    user_metadata: {
        custom_id: string;
        [key: string]: any;
    };
}

export function useEmailAuth() {
    // 本地版本始终返回已登录状态，使用固定的本地用户
    const user: LocalUser = {
        id: 'local-user',
        email: 'local@valpoint.local',
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        user_metadata: {
            custom_id: 'local-user',
        },
    };

    return {
        user,
        isLoading: false,
        signOut: async () => { },
        signIn: async () => { },
    };
}
