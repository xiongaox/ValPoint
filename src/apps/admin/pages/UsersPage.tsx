/**
 * UsersPage - 用户账号管理页
 * 
 * 职责：
 * - 列表展示所有已注册的用户信息
 * - 实现用户搜索、排序（按注册时间或下载量）
 * - 提供用户禁用 (Ban)、资料编辑及账户完全删除功能
 */
import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/Icon';
import UserAvatar from '../../../components/UserAvatar';
import { adminSupabase } from '../../../supabaseClient';
import UserEditModal, { UserProfile } from '../components/UserEditModal';

/**
 * 用户管理页面
 * 接入 Supabase user_profiles 表，支持增删改查
 */
function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [sortField, setSortField] = useState<'created_at' | 'download_count'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // 编辑弹窗状态
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 删除确认状态
    const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 提示消息
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const PAGE_SIZE = 15;

    // 加载用户数据
    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            // 计算分页
            const from = (currentPage - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // 1. 如果是第一页，且不是在纯排序模式（如下载量排序时可能不强制置顶？用户要求"永久置顶"，所以始终执行）
            // 获取管理员 (Pinned)
            let adminUsers: UserProfile[] = [];
            if (currentPage === 1) {
                let adminQuery = adminSupabase
                    .from('user_profiles')
                    .select('*')
                    .in('role', ['admin', 'super_admin']);

                // 应用相同的搜索条件
                if (searchQuery.trim()) {
                    adminQuery = adminQuery.or(`email.ilike.%${searchQuery}%,nickname.ilike.%${searchQuery}%,custom_id.ilike.%${searchQuery}%`);
                }

                const { data: admins } = await adminQuery;

                if (admins) {
                    //在此处手动排序：Super Admin > Admin
                    // 并且在同一等级内按注册时间排序
                    adminUsers = (admins as UserProfile[]).sort((a, b) => {
                        // 优先级值：Super Admin = 2, Admin = 1
                        const getPriority = (role: string) => {
                            if (role === 'super_admin') return 2;
                            if (role === 'admin') return 1;
                            return 0;
                        };
                        const pA = getPriority(a.role);
                        const pB = getPriority(b.role);
                        if (pA !== pB) return pB - pA; // 降序：高优先级在前

                        // 同级按时间倒序
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    });
                }
            }

            // 2. 获取普通用户 (Paginated)
            let userQuery = adminSupabase
                .from('user_profiles')
                .select('*', { count: 'exact' })
                .not('role', 'in', '("admin","super_admin")'); // 排除管理员

            // 搜索过滤
            if (searchQuery.trim()) {
                userQuery = userQuery.or(`email.ilike.%${searchQuery}%,nickname.ilike.%${searchQuery}%,custom_id.ilike.%${searchQuery}%`);
            }

            // 排序
            userQuery = userQuery.order(sortField, { ascending: sortOrder === 'asc' });

            // 分页
            userQuery = userQuery.range(from, to);

            const { data: normalUsers, error, count } = await userQuery;

            if (error) {
                console.error('加载用户列表失败:', error);
                setAlertMessage('加载用户列表失败: ' + error.message);
                return;
            }

            // 合并结果：第一页显示 [Admins, Users]，其他页显示 [Users]
            const finalUsers = currentPage === 1 ? [...adminUsers, ...(normalUsers || [])] : (normalUsers || []);

            console.log('[UsersPage] Loaded users:', finalUsers.map(u => ({ id: u.id, email: u.email, can_batch: u.can_batch_download })));

            setUsers(finalUsers as UserProfile[]);
            setTotalCount(count || 0); // 分页总数仅基于普通用户
        } catch (err) {
            console.error('加载用户列表异常:', err);
            setAlertMessage('加载用户列表失败');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchQuery, sortField, sortOrder]);

    // 初始加载
    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // 搜索防抖
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // 搜索时重置到第一页
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 提示消息自动消失
    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => {
                setAlertMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    // 处理排序
    const handleSort = (field: 'created_at' | 'download_count') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // 打开编辑弹窗
    const handleEdit = (user: UserProfile) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    // 保存用户信息
    const handleSaveUser = async (userId: string, data: Partial<UserProfile>) => {
        setIsSubmitting(true);
        try {
            const { error } = await adminSupabase
                .from('user_profiles')
                .update({
                    nickname: data.nickname,
                    avatar: data.avatar,
                    is_banned: data.is_banned,
                    can_batch_download: data.can_batch_download,
                    ban_reason: data.ban_reason,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select(); // Add select() to return the updated record

            console.log('[UsersPage] Update response:', { error, userId, data: { can_batch_download: data.can_batch_download } });

            if (error) {
                setAlertMessage('保存失败: ' + error.message);
                return;
            }

            setAlertMessage('保存成功');
            setIsEditModalOpen(false);
            setEditingUser(null);
            loadUsers(); // 刷新列表
        } catch (err) {
            setAlertMessage('保存失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 快速切换禁用状态
    const handleToggleBan = async (user: UserProfile) => {
        const newBanStatus = !user.is_banned;
        try {
            const { error } = await adminSupabase
                .from('user_profiles')
                .update({
                    is_banned: newBanStatus,
                    ban_reason: newBanStatus ? '管理员操作' : null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) {
                setAlertMessage('操作失败: ' + error.message);
                return;
            }

            setAlertMessage(newBanStatus ? '已禁用该用户' : '已解除禁用');
            loadUsers();
        } catch (err) {
            setAlertMessage('操作失败');
        }
    };

    // 真正删除用户账户
    const handleDelete = async () => {
        if (!deletingUser) return;
        setIsDeleting(true);
        try {
            // 调用 RPC 函数完全删除用户
            const { error } = await adminSupabase.rpc('delete_user_completely', {
                target_user_id: deletingUser.id
            });

            if (error) {
                setAlertMessage('删除失败: ' + error.message);
                return;
            }

            setAlertMessage('用户已被完全删除');
            setDeletingUser(null);
            loadUsers();
        } catch (err) {
            setAlertMessage('删除失败');
        } finally {
            setIsDeleting(false);
        }
    };

    // 计算分页信息
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const getRoleBadge = (role: string) => {
        if (role === 'super_admin') {
            return (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/30 text-[10px] text-yellow-500 font-bold uppercase tracking-wider">
                    <Icon name="Crown" size={12} />
                    Super
                </div>
            );
        }
        if (role === 'admin') {
            return (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                    <Icon name="Shield" size={12} />
                    Admin
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* 搜索栏 */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Icon
                        name="Search"
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索用户邮箱、昵称或 ID..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0f1923] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4655]/50"
                    />
                </div>
                <button
                    onClick={loadUsers}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-white/10"
                >
                    <Icon name="RefreshCw" size={16} />
                    刷新
                </button>
            </div>

            {/* 用户表格 */}
            <div className="bg-[#1f2326] rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                用户
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                自定义 ID
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('created_at')}
                            >
                                <div className="flex items-center gap-1">
                                    注册时间
                                    {sortField === 'created_at' && (
                                        <Icon name={sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('download_count')}
                            >
                                <div className="flex items-center gap-1">
                                    下载次数
                                    {sortField === 'download_count' && (
                                        <Icon name={sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                状态
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-gray-500 text-sm">加载中...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Icon name="Users" size={32} className="text-gray-600" />
                                        <span className="text-gray-500">暂无用户数据</span>
                                        {searchQuery && (
                                            <span className="text-gray-600 text-sm">
                                                未找到匹配 "{searchQuery}" 的用户
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar email={user.email} size={40} className="rounded-lg" />
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-white font-medium">
                                                        {user.nickname || user.email.split('@')[0]}
                                                    </span>
                                                    {getRoleBadge(user.role)}
                                                </div>
                                                <span className="text-xs text-gray-500">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-mono text-gray-300">
                                            {user.custom_id || '-'}
                                        </span>
                                        {user.can_batch_download && (
                                            <div className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#ff4655]/20 text-[#ff4655] text-[10px] font-medium border border-[#ff4655]/30" title="允许批量下载">
                                                <Icon name="Download" size={10} />
                                                批量
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white">{user.download_count}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleBan(user)}
                                            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded transition-colors ${user.is_banned
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                }`}
                                            title={user.is_banned ? '点击解除禁用' : '点击禁用'}
                                        >
                                            {user.is_banned ? '已禁用' : '正常'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="编辑"
                                            >
                                                <Icon name="Pencil" size={14} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingUser(user)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="删除"
                                            >
                                                <Icon name="Trash2" size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 分页 */}
            <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                    共 {totalCount} 个用户
                    {totalPages > 1 && ` · 第 ${currentPage}/${totalPages} 页`}
                </span>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            上一页
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>

            {/* 编辑弹窗 */}
            <UserEditModal
                isOpen={isEditModalOpen}
                user={editingUser}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                }}
                onSave={handleSaveUser}
                isSubmitting={isSubmitting}
            />

            {/* 删除确认弹窗 */}
            {deletingUser && (
                <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-[#1f2326] border border-white/10 rounded-xl shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                <Icon name="AlertTriangle" size={20} className="text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">确认删除</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">
                            确定要永久删除用户 <span className="text-white font-medium">{deletingUser.email}</span> 吗？
                            <span className="text-red-400">此操作不可撤销，用户账户将被完全删除。</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingUser(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 提示消息 */}
            {alertMessage && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1500] px-6 py-3 bg-[#1f2326] border border-white/10 text-white rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4"
                    onClick={() => setAlertMessage(null)}
                >
                    {alertMessage}
                </div>
            )}
        </div>
    );
}

export default UsersPage;
