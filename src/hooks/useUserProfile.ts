/**
 * useUserProfile - 占位模块（本地版本）
 * 本地化版本不需要用户配置，此模块提供模拟数据
 */

export function useUserProfile() {
    return {
        profile: {
            id: 'local-user',
            custom_id: 'local-user',
            nickname: '本地管理员',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ValPoint',
            role: 'admin' as const,
            can_batch_download: true,
        },
        isLoading: false,
        updateProfile: async () => { },
        refreshProfile: async () => { },
    };
}
