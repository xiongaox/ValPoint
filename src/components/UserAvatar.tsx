/**
 * UserAvatar - 统一的用户头像组件
 * 
 * 职责：
 * - 根据邮箱从 `user_profiles` 表动态获取用户头像
 * - 实现头像数据的全局缓存，避免同一页面内的重复查询
 * - 支持边框定制（颜色和是否显示）
 * - 在用户更新资料后通知所有 Avatar 组件实例同步刷新
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

interface UserAvatarProps {
    /** 用户邮箱 - 用于匹配用户 */
    email: string;
    /** 头像尺寸 */
    size?: number;
    /** 额外的 className */
    className?: string;
    /** 是否显示边框 */
    bordered?: boolean;
    /** 边框颜色 */
    borderColor?: 'default' | 'red' | 'white';
}

// 头像缓存，避免重复请求
const avatarCache = new Map<string, string>();

// 订阅者列表，用于通知头像更新
const subscribers = new Set<() => void>();

// 通知所有订阅者刷新
const notifySubscribers = () => {
    subscribers.forEach(callback => callback());
};
const UserAvatar: React.FC<UserAvatarProps> = ({
    email,
    size = 40,
    className = '',
    bordered = true,
    borderColor = 'default'
}) => {
    const [avatar, setAvatar] = useState<string>('捷风.png');
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // 订阅更新事件
    useEffect(() => {
        const handleRefresh = () => {
            setRefreshKey(prev => prev + 1);
        };
        subscribers.add(handleRefresh);
        return () => {
            subscribers.delete(handleRefresh);
        };
    }, []);

    // 获取头像
    const fetchAvatar = useCallback(async () => {
        if (!email) {
            setLoading(false);
            return;
        }

        // 检查缓存
        const cached = avatarCache.get(email);
        if (cached) {
            setAvatar(cached);
            setLoading(false);
            return;
        }

        try {
            // 从 user_profiles 表查询头像
            const { data, error } = await supabase
                .from('user_profiles')
                .select('avatar')
                .eq('email', email)
                .single();

            if (!error && data?.avatar) {
                setAvatar(data.avatar);
                avatarCache.set(email, data.avatar);
            }
        } catch (err) {
            console.error('获取用户头像失败:', err);
        } finally {
            setLoading(false);
        }
    }, [email]);

    useEffect(() => {
        fetchAvatar();
    }, [fetchAvatar, refreshKey]);

    // 边框样式
    const borderStyles = {
        default: 'border-white/10',
        red: 'border-[#ff4655]/30 shadow-lg shadow-[#ff4655]/10',
        white: 'border-white/20'
    };

    return (
        <div
            className={`rounded-full overflow-hidden flex-shrink-0 bg-[#0f131a] ${bordered ? `border-2 ${borderStyles[borderColor]}` : ''} ${className}`}
            style={{ width: size, height: size }}
        >
            {loading ? (
                <div className="w-full h-full bg-gray-700 animate-pulse" />
            ) : (
                <img
                    src={`/agents/${avatar}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                />
            )}
        </div>
    );
};

/**
 * 更新头像缓存并通知所有订阅者刷新
 * 在用户修改头像后调用，确保所有组件立即更新
 */
export const updateAvatarCache = (email: string, avatar: string) => {
    avatarCache.set(email, avatar);
    // 通知所有订阅者刷新
    notifySubscribers();
};

/**
 * 清除头像缓存
 */
export const clearAvatarCache = (email?: string) => {
    if (email) {
        avatarCache.delete(email);
    } else {
        avatarCache.clear();
    }
    notifySubscribers();
};

export default UserAvatar;
