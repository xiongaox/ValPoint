/**
 * useEmailAuth.ts - 邮箱认证逻辑 Hook
 * 
 * 职责：
 * - 处理用户登录、注册、找回密码及登出流程
 * - 维护当前登录用户的 Session 状态
 * - 提供身份验证相关的加载状态与错误处理
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { validateEmail } from '../lib/emailValidator';

// 开发环境绕过邮箱
const DEV_BYPASS_EMAIL = import.meta.env.VITE_DEV_BYPASS_EMAIL;

interface UseEmailAuthResult {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    signInWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
    signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUpWithEmail: (email: string, password: string, data?: object) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    verifyOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
    updateProfile: (data: { nickname?: string; avatar?: string; custom_id?: string }) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
}

/**
 * Supabase 邮箱认证 Hook
 * 支持密码登录、注册、忘记密码
 */
export function useEmailAuth(): UseEmailAuthResult {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 初始化时检查会话
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (err) {
                console.error('获取会话失败:', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        // 监听认证状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // 邮箱密码注册
    const signUpWithEmail = useCallback(async (email: string, password: string, data?: object): Promise<{ success: boolean; error?: string }> => {
        setError(null);

        // 验证邮箱
        const validation = validateEmail(email);
        if (!validation.isValid) {
            setError(validation.error || '邮箱格式不正确');
            return { success: false, error: validation.error };
        }

        if (password.length < 6) {
            const errMsg = '密码至少需要6位';
            setError(errMsg);
            return { success: false, error: errMsg };
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin + window.location.pathname,
                    data: data,
                },
            });

            if (error) {
                setError(error.message);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : '注册失败';
            setError(message);
            return { success: false, error: message };
        }
    }, []);

    // 邮箱密码登录
    const signInWithPassword = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setError(null);

        // 验证邮箱
        const validation = validateEmail(email);
        if (!validation.isValid) {
            setError(validation.error || '邮箱格式不正确');
            return { success: false, error: validation.error };
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // 友好化错误信息
                let friendlyError = error.message;
                if (error.message.includes('Invalid login credentials')) {
                    friendlyError = '邮箱或密码错误';
                } else if (error.message.includes('Email not confirmed')) {
                    friendlyError = '请先验证邮箱';
                }
                setError(friendlyError);
                return { success: false, error: friendlyError };
            }

            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : '登录失败';
            setError(message);
            return { success: false, error: message };
        }
    }, []);

    // 发送密码重置邮件
    const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
        setError(null);

        // 验证邮箱
        const validation = validateEmail(email);
        if (!validation.isValid) {
            setError(validation.error || '邮箱格式不正确');
            return { success: false, error: validation.error };
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/shared.html',
            });

            if (error) {
                setError(error.message);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : '发送重置邮件失败';
            setError(message);
            return { success: false, error: message };
        }
    }, []);

    // 发送 Magic Link 登录（保留作为备用）
    const signInWithEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
        setError(null);

        // 开发环境绕过验证
        if (DEV_BYPASS_EMAIL && email === DEV_BYPASS_EMAIL) {
            const { error } = await supabase.auth.signInWithPassword({
                email: DEV_BYPASS_EMAIL,
                password: 'dev_test_password_123',
            });

            if (error) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email: DEV_BYPASS_EMAIL,
                    password: 'dev_test_password_123',
                });
                if (signUpError) {
                    setError(signUpError.message);
                    return { success: false, error: signUpError.message };
                }
            }
            return { success: true };
        }

        // 验证邮箱
        const validation = validateEmail(email);
        if (!validation.isValid) {
            setError(validation.error || '邮箱验证失败');
            return { success: false, error: validation.error };
        }

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin + window.location.pathname,
                },
            });

            if (error) {
                setError(error.message);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : '登录失败';
            setError(message);
            return { success: false, error: message };
        }
    }, []);

    // 验证 OTP 验证码
    const verifyOtp = useCallback(async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
        setError(null);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email',
            });

            if (error) {
                let friendlyError = error.message;
                if (error.message.includes('Token has expired')) {
                    friendlyError = '验证码已过期，请重新获取';
                } else if (error.message.includes('Invalid')) {
                    friendlyError = '验证码错误';
                }
                setError(friendlyError);
                return { success: false, error: friendlyError };
            }

            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : '验证失败';
            setError(message);
            return { success: false, error: message };
        }
    }, []);

    // 更新用户资料
    const updateProfile = useCallback(async (data: { nickname?: string; avatar?: string; custom_id?: string }): Promise<{ success: boolean; error?: string }> => {
        try {
            // 1. 更新 auth.users 的 metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: data
            });

            if (authError) {
                return { success: false, error: authError.message };
            }

            // 2. 同时更新 user_profiles 表，确保数据一致性
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
                const updateData: Record<string, string | null> = {};
                if (data.nickname !== undefined) updateData.nickname = data.nickname;
                if (data.avatar !== undefined) updateData.avatar = data.avatar;
                if (data.custom_id !== undefined) updateData.custom_id = data.custom_id;

                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .update(updateData)
                    .eq('id', currentUser.id);

                if (profileError) {
                    console.error('更新 user_profiles 失败:', profileError);
                    // 不返回错误，因为 auth 已经更新成功
                }
            }

            // 3. 更新本地 user 状态
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);

            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : '更新资料失败';
            return { success: false, error: message };
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
        } catch (err) {
            console.error('退出登录失败:', err);
        }
    }, []);

    return {
        user,
        isLoading,
        error,
        signInWithEmail,
        signInWithPassword,
        signUpWithEmail,
        resetPassword,
        verifyOtp,
        updateProfile,
        signOut,
    };
}

