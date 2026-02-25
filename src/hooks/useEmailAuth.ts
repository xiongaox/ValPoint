/**
 * useEmailAuth - Hook 层
 *
 * 模块定位：
 * - 所在层级：Hook 层
 * - 主要目标：封装状态、副作用与交互流程
 *
 * 关键职责：
 * - 封装状态管理与副作用控制
 * - 对外暴露清晰的交互动作与派生状态
 * - 隔离组件层与数据层耦合
 *
 * 主要导出：
 * - `useEmailAuth`
 *
 * 依赖关系：
 * - 上游依赖：`react`、`../supabaseClient`、`@supabase/supabase-js`、`../lib/emailValidator`
 * - 下游影响：供组件与控制器复用
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { validateEmail } from '../lib/emailValidator';

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

export function useEmailAuth(): UseEmailAuthResult {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const signUpWithEmail = useCallback(async (email: string, password: string, data?: object): Promise<{ success: boolean; error?: string }> => {
        setError(null);

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

    const signInWithPassword = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setError(null);



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

    const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
        setError(null);

        const validation = validateEmail(email);
        if (!validation.isValid) {
            setError(validation.error || '邮箱格式不正确');
            return { success: false, error: validation.error };
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/',
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

    const signInWithEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
        setError(null);

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

    const updateProfile = useCallback(async (data: { nickname?: string; avatar?: string; custom_id?: string }): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: authError } = await supabase.auth.updateUser({
                data: data
            });

            if (authError) {
                return { success: false, error: authError.message };
            }

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
                }
            }

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

