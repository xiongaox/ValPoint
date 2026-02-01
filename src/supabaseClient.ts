/**
 * Supabase 客户端占位文件
 * 
 * 本地化版本不使用 Supabase，此文件仅为兼容性保留。
 * 所有实际的 API 调用已迁移到本地后端。
 */

// 模拟 Supabase 客户端接口（用于兼容仍引用此模块的代码）
export const supabase = {
    from: () => ({
        select: () => ({
            eq: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
                limit: () => Promise.resolve({ data: [], error: null }),
                single: () => Promise.resolve({ data: null, error: null }),
            }),
            order: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null }),
        }),
        insert: () => ({
            select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
    }),
    auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: (credentials: any) => Promise.resolve({ data: null, error: new Error('本地版本无需登录') }),
        signOut: () => Promise.resolve({ error: null }),
        updateUser: (attributes: any) => Promise.resolve({ data: { user: null }, error: new Error('本地版本不支持修改用户') }),
        onAuthStateChange: (callback: any) => {
            // 模拟未登录状态
            setTimeout(() => callback('SIGNED_OUT', null), 0);
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
    },
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: null, error: new Error('请使用本地上传 API') }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
    },
    functions: {
        invoke: () => Promise.resolve({ data: null, error: new Error('请使用本地代理 API') }),
    },
};

// Admin 版本使用相同的占位对象
export const adminSupabase = supabase;

export default supabase;
