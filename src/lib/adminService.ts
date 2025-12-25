/**
 * 管理员权限服务
 * 从 user_profiles.role 字段检查管理员权限
 */
import { supabase } from '../supabaseClient';

/** 管理员用户类型 */
export interface AdminUser {
    id: string;
    email: string | null;
    nickname: string | null;
    role: 'user' | 'admin' | 'super_admin';
    avatar: string | null;
    custom_id: string | null;
    created_at: string;
}

/** 权限检查结果 */
export interface AdminAccessResult {
    isAdmin: boolean;
    isSuperAdmin: boolean;
    adminInfo: AdminUser | null;
}

/**
 * 检查用户是否有管理员权限
 * 从 user_profiles.role 字段读取
 */
export async function checkAdminAccess(userId: string): Promise<AdminAccessResult> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return {
            isAdmin: false,
            isSuperAdmin: false,
            adminInfo: null,
        };
    }

    const role = data.role as 'user' | 'admin' | 'super_admin';

    return {
        isAdmin: role === 'admin' || role === 'super_admin',
        isSuperAdmin: role === 'super_admin',
        adminInfo: data as AdminUser,
    };
}

/**
 * 通过邮箱检查用户是否有管理员权限
 */
export async function checkAdminAccessByEmail(email: string): Promise<AdminAccessResult> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !data) {
        return {
            isAdmin: false,
            isSuperAdmin: false,
            adminInfo: null,
        };
    }

    const role = data.role as 'user' | 'admin' | 'super_admin';

    return {
        isAdmin: role === 'admin' || role === 'super_admin',
        isSuperAdmin: role === 'super_admin',
        adminInfo: data as AdminUser,
    };
}

/**
 * 获取所有管理员列表
 * 返回 role 为 admin 或 super_admin 的用户
 */
export async function getAdminList(): Promise<AdminUser[]> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['admin', 'super_admin'])
        .order('created_at', { ascending: true });

    if (error) {
        console.error('获取管理员列表失败:', error);
        return [];
    }

    return data as AdminUser[];
}

/**
 * 添加管理员
 * 仅超级管理员可调用，将 user_profiles.role 设置为 admin
 */
export async function addAdmin(
    email: string,
    _nickname?: string
): Promise<{ success: boolean; error?: string }> {
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: '未登录' };
    }

    // 检查是否为超级管理员
    const access = await checkAdminAccess(user.id);
    if (!access.isSuperAdmin) {
        return { success: false, error: '无权限' };
    }

    // 检查目标用户是否存在
    const existingAccess = await checkAdminAccessByEmail(email);
    if (!existingAccess.adminInfo) {
        return { success: false, error: '用户不存在，请先让用户注册' };
    }

    if (existingAccess.isAdmin) {
        return { success: false, error: '该用户已是管理员' };
    }

    // 更新 role 为 admin
    const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('email', email);

    if (error) {
        console.error('添加管理员失败:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * 移除管理员
 * 仅超级管理员可调用，将 user_profiles.role 设置回 user
 */
export async function removeAdmin(
    adminId: string
): Promise<{ success: boolean; error?: string }> {
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: '未登录' };
    }

    // 检查是否为超级管理员
    const access = await checkAdminAccess(user.id);
    if (!access.isSuperAdmin) {
        return { success: false, error: '无权限' };
    }

    // 检查目标用户是否是超级管理员（不能降级）
    const targetAccess = await checkAdminAccess(adminId);
    if (targetAccess.isSuperAdmin) {
        return { success: false, error: '无法移除超级管理员' };
    }

    // 将 role 设置回 user
    const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'user' })
        .eq('id', adminId);

    if (error) {
        console.error('移除管理员失败:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * 更新管理员的 user_id（已废弃，保留接口兼容性）
 * @deprecated 新架构不再需要此函数
 */
export async function updateAdminUserId(
    _email: string,
    _userId: string
): Promise<{ success: boolean }> {
    // 在新架构中，user_profiles.id 直接关联 auth.users.id，无需单独更新
    return { success: true };
}
