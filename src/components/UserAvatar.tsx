/**
 * UserAvatar - 用户头像
 *
 * 职责：
 * - 渲染用户头像相关的界面结构与样式。
 * - 处理用户交互与状态变更并触发回调。
 * - 组合子组件并提供可配置项。
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAvatarByEmail } from '../utils/avatarUtils';

interface UserAvatarProps {
    email: string;
    size?: number;
    className?: string;
    bordered?: boolean;
    borderColor?: 'default' | 'red' | 'white';
    avatarUrl?: string | null;
}

const getInitialCache = () => {
    try {
        const stored = localStorage.getItem('valpoint_avatar_cache');
        return stored ? new Map<string, string>(JSON.parse(stored)) : new Map<string, string>();
    } catch (e) {
        return new Map<string, string>();
    }
};

const avatarCache = getInitialCache();

const subscribers = new Set<() => void>();

const notifySubscribers = () => {
    subscribers.forEach(callback => callback());
};

const persistCache = () => {
    try {
        localStorage.setItem('valpoint_avatar_cache', JSON.stringify(Array.from(avatarCache.entries())));
    } catch (e) {
        console.warn('Failed to save avatar cache to localStorage', e);
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === 'valpoint_avatar_cache' && event.newValue) {
            try {
                const newCache = new Map<string, string>(JSON.parse(event.newValue));
                avatarCache.clear();
                newCache.forEach((value, key) => avatarCache.set(key, value));
                notifySubscribers();
            } catch (e) {
                console.warn('Failed to sync avatar cache from storage event', e);
            }
        }
    });
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    email,
    size = 40,
    className = '',
    bordered = true,
    borderColor = 'default',
    avatarUrl
}) => {
    const normalizedEmail = useMemo(() => (email || '').toLowerCase(), [email]);

    const defaultAvatar = useMemo(() => getAvatarByEmail(normalizedEmail), [normalizedEmail]);
    const [avatar, setAvatar] = useState<string>(avatarUrl || defaultAvatar);
    const [loading, setLoading] = useState(!avatarUrl);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const handleRefresh = () => {
            setRefreshKey(prev => prev + 1);
        };
        subscribers.add(handleRefresh);
        return () => {
            subscribers.delete(handleRefresh);
        };
    }, []);

    useEffect(() => {
        if (avatarUrl) {
            setAvatar(avatarUrl);
            setLoading(false);
            return;
        }

        const cached = avatarCache.get(normalizedEmail);
        if (cached) {
            setAvatar(cached);
            setLoading(false);
        } else {
            if (normalizedEmail) {
                setAvatar(defaultAvatar); // 说明：加载中使用默认头像，避免闪烁。
                setLoading(true);
            } else {
                setLoading(true); // 说明：无邮箱时显示骨架。
            }
        }
    }, [normalizedEmail, defaultAvatar]);

    const fetchAvatar = useCallback(async () => {
        if (!normalizedEmail) return;

        if (avatarCache.has(normalizedEmail)) {
            const cachedParams = avatarCache.get(normalizedEmail);
            setAvatar(cachedParams!);
        }

        // 本地版已移除完整的用户 Profile 实时同步，仅依缓存逻辑
        setLoading(false);
    }, [normalizedEmail]);

    useEffect(() => {
        fetchAvatar();

        const onFocus = () => {
            fetchAvatar();
        };
        window.addEventListener('focus', onFocus);

        return () => {
            window.removeEventListener('focus', onFocus);
        };
    }, [fetchAvatar, normalizedEmail, refreshKey]);

    const borderStyles = {
        default: 'border-white/10',
        red: 'border-[#ff4655]/30 shadow-lg shadow-[#ff4655]/10',
        white: 'border-white/20'
    };

    return (
        <div
            className={`rounded-xl overflow-hidden flex-shrink-0 bg-[#0f131a] ${bordered ? `border-2 ${borderStyles[borderColor]}` : ''} ${className}`}
            style={{ width: size, height: size }}
        >
            {loading ? (
                <div className="w-full h-full bg-gray-700 animate-pulse" />
            ) : (
                <img
                    src={avatar.startsWith('http') ? avatar : `/agents/${avatar}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                />
            )}
        </div>
    );
};

export const updateAvatarCache = (email: string, avatar: string) => {
    avatarCache.set(email.toLowerCase(), avatar);
    persistCache(); // 说明：写入本地缓存。
    notifySubscribers();
};

export const clearAvatarCache = (email?: string) => {
    if (email) {
        avatarCache.delete(email.toLowerCase());
    } else {
        avatarCache.clear();
    }
    persistCache(); // 说明：写入本地缓存。
    notifySubscribers();
};

export default UserAvatar;
