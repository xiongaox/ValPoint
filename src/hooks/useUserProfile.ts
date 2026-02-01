import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'valpoint_user_profile';

const DEFAULT_PROFILE = {
    id: 'local-user',
    custom_id: 'local-user',
    nickname: '本地管理员',
    avatar: '/avatars/avatar_01.png',
    role: 'admin' as const,
    can_batch_download: true,
};

export function useUserProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 初始加载
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setProfile(JSON.parse(saved));
            } catch (e) {
                setProfile(DEFAULT_PROFILE);
            }
        } else {
            setProfile(DEFAULT_PROFILE);
        }
        setIsLoading(false);
    }, []);

    const updateProfile = useCallback(async (data: any) => {
        try {
            const newProfile = { ...profile, ...data };
            setProfile(newProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
            return { success: true, error: null };
        } catch (error) {
            return { success: false, error: '保存失败' };
        }
    }, [profile]);

    const refreshProfile = useCallback(async () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setProfile(JSON.parse(saved));
        }
    }, []);

    return {
        profile: profile || DEFAULT_PROFILE,
        isLoading,
        updateProfile,
        refreshProfile,
    };
}
