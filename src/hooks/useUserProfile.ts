import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useEmailAuth } from './useEmailAuth';

export interface UserProfile {
    id: string;
    email: string | null;
    nickname: string | null;
    avatar: string | null;
    custom_id: string | null;
    role: 'user' | 'admin' | 'super_admin';
    is_banned: boolean;
    ban_reason: string | null;
    download_count: number;
    created_at: string;
    updated_at: string;
}

interface UseUserProfileResult {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    updateProfile: (data: Partial<Pick<UserProfile, 'nickname' | 'avatar' | 'custom_id'>>) => Promise<{ success: boolean; error?: string }>;
}

/**
 * 用户配置 Hook
 * 从 public.user_profiles 表读取用户业务数据
 */
export function useUserProfile(): UseUserProfileResult {
    const { user } = useEmailAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 获取用户配置
    const fetchProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (fetchError) {
                // 如果是 404，说明触发器还没跑完，稍后重试
                if (fetchError.code === 'PGRST116') {
                    console.warn('用户配置尚未同步，2秒后重试...');
                    setTimeout(fetchProfile, 2000);
                    return;
                }
                throw fetchError;
            }

            setProfile(data as UserProfile);
        } catch (err: any) {
            console.error('获取用户配置失败:', err);
            setError(err.message || '获取用户信息失败');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // 监听用户变化
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // 更新用户配置（写入 user_profiles 表）
    const updateProfile = useCallback(async (
        data: Partial<Pick<UserProfile, 'nickname' | 'avatar' | 'custom_id'>>
    ): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            return { success: false, error: '未登录' };
        }

        try {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 刷新本地数据
            await fetchProfile();

            return { success: true };
        } catch (err: any) {
            console.error('更新用户配置失败:', err);
            return { success: false, error: err.message || '更新失败' };
        }
    }, [user, fetchProfile]);

    return {
        profile,
        isLoading,
        error,
        refetch: fetchProfile,
        updateProfile,
    };
}
