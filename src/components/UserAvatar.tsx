/**
 * UserAvatar - 统一的用户头像组件
 * 
 * 职责：
 * - 根据邮箱从 `user_profiles` 表动态获取用户头像
 * - 实现头像数据的全局缓存，避免同一页面内的重复查询
 * - 支持边框定制（颜色和是否显示）
 * - 在用户更新资料后通知所有 Avatar 组件实例同步刷新
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { getAvatarByEmail } from '../utils/avatarUtils';

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
// 初始化时尝试从 LocalStorage 读取
const getInitialCache = () => {
    try {
        const stored = localStorage.getItem('valpoint_avatar_cache');
        return stored ? new Map<string, string>(JSON.parse(stored)) : new Map<string, string>();
    } catch (e) {
        return new Map<string, string>();
    }
};

const avatarCache = getInitialCache();

// 订阅者列表，用于通知头像更新
const subscribers = new Set<() => void>();

// 通知所有订阅者刷新
const notifySubscribers = () => {
    subscribers.forEach(callback => callback());
};

// 持久化缓存到 LocalStorage
const persistCache = () => {
    try {
        localStorage.setItem('valpoint_avatar_cache', JSON.stringify(Array.from(avatarCache.entries())));
    } catch (e) {
        console.warn('Failed to save avatar cache to localStorage', e);
    }
};

const UserAvatar: React.FC<UserAvatarProps> = ({
    email,
    size = 40,
    className = '',
    bordered = true,
    borderColor = 'default'
}) => {
    // 统一转换为小写，确保缓存的一致性
    const normalizedEmail = useMemo(() => (email || '').toLowerCase(), [email]);

    // 使用邮箱生成确定性随机默认头像
    const defaultAvatar = useMemo(() => getAvatarByEmail(normalizedEmail), [normalizedEmail]);
    const [avatar, setAvatar] = useState<string>(defaultAvatar);
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

    // 当邮箱变化导致默认头像变化时，重置状态
    useEffect(() => {
        // 如果有缓存，立即使用
        const cached = avatarCache.get(normalizedEmail);
        if (cached) {
            setAvatar(cached);
            setLoading(false);
        } else {
            // 如果没缓存，根据是否有邮箱决定是否显示加载状态
            if (normalizedEmail) {
                setAvatar(defaultAvatar); // 预设为默认头像，但被 loading 遮盖，防止 loading 消失瞬间闪烁
                setLoading(true);
            } else {
                setLoading(true); // 无邮箱时显示骨架屏
            }
        }
    }, [normalizedEmail, defaultAvatar]);

    // 获取头像
    const fetchAvatar = useCallback(async () => {
        if (!normalizedEmail) {
            // 没邮箱，不需要 fetch，由上面的 effect 控制 loading 状态
            return;
        }

        // 检查缓存
        // 注意：即使有缓存，我们仍然可以在后台静默刷新，以确保数据最新 (Stale-while-revalidate)
        // 但为了性能，如果缓存存在，我们先不强制刷新，除非 explicit refresh
        if (avatarCache.has(normalizedEmail)) {
            return;
        }

        try {
            // 确保 loading 为 true
            setLoading(true);

            // 从 user_profiles 表查询头像
            const { data, error } = await supabase
                .from('user_profiles')
                .select('avatar')
                .eq('email', normalizedEmail)
                .single();

            if (!error && data?.avatar) {
                setAvatar(data.avatar);
                updateAvatarCache(normalizedEmail, data.avatar);
            }
        } catch (err) {
            console.error('获取用户头像失败:', err);
        } finally {
            setLoading(false);
        }
    }, [normalizedEmail]);

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
    avatarCache.set(email.toLowerCase(), avatar);
    persistCache(); // 保存到 LocalStorage
    // 通知所有订阅者刷新
    notifySubscribers();
};

/**
 * 清除头像缓存
 */
export const clearAvatarCache = (email?: string) => {
    if (email) {
        avatarCache.delete(email.toLowerCase());
    } else {
        avatarCache.clear();
    }
    persistCache(); // 保存到 LocalStorage
    notifySubscribers();
};

export default UserAvatar;
