-- ==========================================
-- ValPoint Supabase 数据库一键重建脚本
-- 版本: 2.1 | 优化日期: 2025-12-29
-- ==========================================
-- 使用说明:
-- 1. 在 Supabase Dashboard -> SQL Editor 中执行此脚本
-- 2. 执行前确保已启用 Email Auth Provider
-- 3. 脚本是幂等的，可重复执行
-- ==========================================

-- ==========================================
-- 1. 基础扩展
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- 用于密码加密 (gen_salt, crypt)

-- ==========================================
-- 2. 通用函数
-- ==========================================

-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 新用户注册时自动创建 user_profiles 记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, nickname, custom_id, avatar, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nickname', ''),
        COALESCE(NEW.raw_user_meta_data->>'custom_id', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar', ''),
        'user'
    );
    RETURN NEW;
END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 自动累计下载次数
CREATE OR REPLACE FUNCTION public.increment_user_download_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.user_profiles
        SET download_count = COALESCE(download_count, 0) + COALESCE(NEW.download_count, 1)
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [优化] 管理员权限检查函数 (提升 RLS 性能与可读性)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. 数据表定义
-- ==========================================

-- 3.1 用户资料表
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nickname TEXT,
    avatar TEXT,
    custom_id TEXT UNIQUE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    download_count BIGINT DEFAULT 0,
    can_batch_download BOOLEAN DEFAULT false,
    pinned_lineup_ids JSONB DEFAULT '[]'::jsonb,
    subscriptions JSONB DEFAULT '[]'::jsonb, -- 用户订阅列表
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 个人点位库
CREATE TABLE IF NOT EXISTS public.valorant_lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    map_name TEXT,
    agent_name TEXT,
    agent_icon TEXT,
    skill_icon TEXT,
    side TEXT CHECK (side IN ('attack', 'defense')),
    ability_index INTEGER,
    agent_pos JSONB,
    skill_pos JSONB,
    stand_img TEXT,
    stand_desc TEXT,
    stand2_img TEXT,
    stand2_desc TEXT,
    aim_img TEXT,
    aim_desc TEXT,
    aim2_img TEXT,
    aim2_desc TEXT,
    land_img TEXT,
    land_desc TEXT,
    source_link TEXT,
    cloned_from UUID,
    author_name TEXT,
    author_avatar TEXT,
    author_uid TEXT,
    creator_id TEXT, -- 点位创建者的 custom_id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 共享中心库
CREATE TABLE IF NOT EXISTS public.valorant_shared (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id TEXT,
    title TEXT,
    map_name TEXT,
    agent_name TEXT,
    agent_icon TEXT,
    skill_icon TEXT,
    side TEXT CHECK (side IN ('attack', 'defense')),
    ability_index INTEGER,
    agent_pos JSONB,
    skill_pos JSONB,
    stand_img TEXT,
    stand_desc TEXT,
    stand2_img TEXT,
    stand2_desc TEXT,
    aim_img TEXT,
    aim_desc TEXT,
    aim2_img TEXT,
    aim2_desc TEXT,
    land_img TEXT,
    land_desc TEXT,
    source_link TEXT,
    author_name TEXT,
    author_avatar TEXT,
    author_uid TEXT,
    creator_id TEXT, -- 点位创建者/投稿者的 custom_id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 点位投稿审核表
CREATE TABLE IF NOT EXISTS public.lineup_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    submitter_email TEXT,
    title TEXT,
    map_name TEXT,
    agent_name TEXT,
    agent_icon TEXT,
    skill_icon TEXT,
    side TEXT DEFAULT 'attack' CHECK (side IN ('attack', 'defense')),
    ability_index INTEGER,
    agent_pos JSONB,
    skill_pos JSONB,
    description TEXT,
    stand_img TEXT,
    stand_desc TEXT,
    stand2_img TEXT,
    stand2_desc TEXT,
    aim_img TEXT,
    aim_desc TEXT,
    aim2_img TEXT,
    aim2_desc TEXT,
    land_img TEXT,
    land_desc TEXT,
    source_link TEXT,
    author_name TEXT,
    author_avatar TEXT,
    author_uid TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 每日下载限制表
CREATE TABLE IF NOT EXISTS public.user_daily_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 3.6 系统设置表
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    official_oss_config JSONB,
    submission_enabled BOOLEAN DEFAULT true,
    daily_submission_limit INTEGER DEFAULT 10,
    daily_download_limit INTEGER DEFAULT 50,
    author_links JSONB DEFAULT '{
        "github_url": "",
        "tutorial_url": "",
        "donate_wechat_qr": "",
        "donate_alipay_qr": "",
        "contact_wechat_qr": ""
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初始化系统设置（如果不存在）
INSERT INTO public.system_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 8.1 下载日志表 (放置于此以统一创建)
CREATE TABLE IF NOT EXISTS public.download_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    lineup_id TEXT,
    lineup_title TEXT,
    map_name TEXT,
    agent_name TEXT,
    download_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.2 地图池配置表 (存储排位模式地图轮换状态)
CREATE TABLE IF NOT EXISTS public.map_pool_config (
    map_name TEXT PRIMARY KEY,
    pool_status TEXT CHECK (pool_status IN ('in-pool', 'returning', 'rotated-out')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.map_pool_config IS '排位地图池配置，存储地图的排位池状态（在池/回归/轮出）';

-- ==========================================
-- 4. 触发器
-- ==========================================

-- 4.1 新用户注册触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.2 自动更新 updated_at 触发器 (对所有表循环应用)
-- user_profiles
DROP TRIGGER IF EXISTS tr_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER tr_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
-- valorant_lineups
DROP TRIGGER IF EXISTS tr_valorant_lineups_updated_at ON public.valorant_lineups;
CREATE TRIGGER tr_valorant_lineups_updated_at BEFORE UPDATE ON public.valorant_lineups FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
-- valorant_shared
DROP TRIGGER IF EXISTS tr_valorant_shared_updated_at ON public.valorant_shared;
CREATE TRIGGER tr_valorant_shared_updated_at BEFORE UPDATE ON public.valorant_shared FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
-- lineup_submissions
DROP TRIGGER IF EXISTS tr_lineup_submissions_updated_at ON public.lineup_submissions;
CREATE TRIGGER tr_lineup_submissions_updated_at BEFORE UPDATE ON public.lineup_submissions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
-- user_daily_downloads
DROP TRIGGER IF EXISTS tr_user_daily_downloads_updated_at ON public.user_daily_downloads;
CREATE TRIGGER tr_user_daily_downloads_updated_at BEFORE UPDATE ON public.user_daily_downloads FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4.3 下载日志触发器 (累计总下载次数)
DROP TRIGGER IF EXISTS on_download_log_created ON public.download_logs;
CREATE TRIGGER on_download_log_created
    AFTER INSERT ON public.download_logs
    FOR EACH ROW EXECUTE FUNCTION public.increment_user_download_count();

-- ==========================================
-- 5. 行级安全策略 (RLS)
-- ==========================================

-- 启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valorant_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valorant_shared ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_pool_config ENABLE ROW LEVEL SECURITY;

-- 5.2 user_profiles 策略
-- 创建获取用户角色的函数（SECURITY DEFINER 绕过 RLS，避免无限递归）
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM user_profiles WHERE id = user_id;
$$;

DROP POLICY IF EXISTS "Allow anon read user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "用户可查看任何人但仅修改本人 Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "users_insert_policy" ON public.user_profiles;

-- SELECT: 任何人可查看用户资料
CREATE POLICY "users_select_policy" ON public.user_profiles 
FOR SELECT USING (true);

-- INSERT: 用户只能创建自己的资料（由 handle_new_user 触发器处理）
CREATE POLICY "users_insert_policy" ON public.user_profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: 用户可修改自己的资料 OR 管理员可修改任何人的资料
CREATE POLICY "users_update_policy" ON public.user_profiles 
FOR UPDATE
USING (auth.uid() = id OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin'))
WITH CHECK (auth.uid() = id OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- 5.3 valorant_lineups 策略 (个人库)
DROP POLICY IF EXISTS "Users can view own lineups" ON public.valorant_lineups;
CREATE POLICY "Users can view own lineups" ON public.valorant_lineups FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own lineups" ON public.valorant_lineups;
CREATE POLICY "Users can insert own lineups" ON public.valorant_lineups FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own lineups" ON public.valorant_lineups;
CREATE POLICY "Users can update own lineups" ON public.valorant_lineups FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own lineups" ON public.valorant_lineups;
CREATE POLICY "Users can delete own lineups" ON public.valorant_lineups FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 5.4 valorant_shared 策略 (共享库 - 使用 is_admin 优化)
DROP POLICY IF EXISTS "Anyone can view shared lineups" ON public.valorant_shared;
CREATE POLICY "Anyone can view shared lineups" ON public.valorant_shared FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify shared lineups" ON public.valorant_shared;
CREATE POLICY "Only admins can modify shared lineups" ON public.valorant_shared FOR ALL TO authenticated USING (public.is_admin());

-- 5.5 lineup_submissions 策略 (投稿 - 使用 is_admin 优化)
DROP POLICY IF EXISTS "Users can view own submissions" ON public.lineup_submissions;
CREATE POLICY "Users can view own submissions" ON public.lineup_submissions FOR SELECT TO authenticated
    USING (submitter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own submissions" ON public.lineup_submissions;
CREATE POLICY "Users can insert own submissions" ON public.lineup_submissions FOR INSERT TO authenticated WITH CHECK (submitter_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own submissions" ON public.lineup_submissions;
CREATE POLICY "Users can update own submissions" ON public.lineup_submissions FOR UPDATE TO authenticated
    USING (submitter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own submissions" ON public.lineup_submissions;
CREATE POLICY "Users can delete own submissions" ON public.lineup_submissions FOR DELETE TO authenticated USING (submitter_id = auth.uid());

-- 5.6 user_daily_downloads 策略
DROP POLICY IF EXISTS "Users can view own downloads" ON public.user_daily_downloads;
CREATE POLICY "Users can view own downloads" ON public.user_daily_downloads FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can upsert own downloads" ON public.user_daily_downloads;
CREATE POLICY "Users can upsert own downloads" ON public.user_daily_downloads FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5.7 system_settings 策略 (使用 is_admin 优化)
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
CREATE POLICY "Anyone can read system settings" ON public.system_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can update system settings" ON public.system_settings;
CREATE POLICY "Only admins can update system settings" ON public.system_settings FOR UPDATE TO authenticated USING (public.is_admin());

-- 5.8 download_logs 策略 (使用 is_admin 优化)
DROP POLICY IF EXISTS "Users can insert own download logs" ON public.download_logs;
CREATE POLICY "Users can insert own download logs" ON public.download_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all download logs" ON public.download_logs;
CREATE POLICY "Admins can view all download logs" ON public.download_logs FOR SELECT TO authenticated USING (public.is_admin());

-- 5.9 map_pool_config 策略
DROP POLICY IF EXISTS "Anyone can read map pool config" ON public.map_pool_config;
CREATE POLICY "Anyone can read map pool config" ON public.map_pool_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify map pool config" ON public.map_pool_config;
CREATE POLICY "Only admins can modify map pool config" ON public.map_pool_config FOR ALL TO authenticated USING (public.is_admin());

-- ==========================================
-- 6. Storage 存储桶配置 (优化：自动创建存储桶)
-- ==========================================
-- 创建 submissions 桶 (公开, 限制 8MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'submissions', 
    'submissions', 
    true, 
    8388608, -- 8MB in bytes
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[] -- 限制为图片格式
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS 策略 (用于 submissions 存储桶)
-- 注意: Supabase 默认启用 storage.objects 的 RLS，必须创建策略才能访问
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'submissions');

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'submissions');

-- 管理员可以删除临时图片
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
CREATE POLICY "Admin Delete" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'submissions' AND public.is_admin());

-- ==========================================
-- 7. 索引优化 (大幅增强查询性能)
-- ==========================================
-- 个人库索引
CREATE INDEX IF NOT EXISTS idx_valorant_lineups_user_id ON public.valorant_lineups(user_id);
CREATE INDEX IF NOT EXISTS idx_valorant_lineups_map_agent ON public.valorant_lineups(map_name, agent_name);
CREATE INDEX IF NOT EXISTS idx_valorant_lineups_side ON public.valorant_lineups(side);
CREATE INDEX IF NOT EXISTS idx_valorant_lineups_cloned_from ON public.valorant_lineups(cloned_from);
CREATE INDEX IF NOT EXISTS idx_valorant_lineups_creator_id ON public.valorant_lineups(creator_id);

-- 共享库索引
CREATE INDEX IF NOT EXISTS idx_valorant_shared_map_agent ON public.valorant_shared(map_name, agent_name);
CREATE INDEX IF NOT EXISTS idx_valorant_shared_source_id ON public.valorant_shared(source_id);
CREATE INDEX IF NOT EXISTS idx_valorant_shared_side ON public.valorant_shared(side);
CREATE INDEX IF NOT EXISTS idx_valorant_shared_creator_id ON public.valorant_shared(creator_id);

-- 投稿审核索引
CREATE INDEX IF NOT EXISTS idx_lineup_submissions_submitter ON public.lineup_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_lineup_submissions_status ON public.lineup_submissions(status);

-- 每日下载索引
CREATE INDEX IF NOT EXISTS idx_user_daily_downloads_lookup ON public.user_daily_downloads(user_id, date);

-- 下载日志索引
CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON public.download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_created_at ON public.download_logs(created_at DESC);

-- 用户资料索引 (Email用于登录查询，CustomID用于公开主页)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_custom_id ON public.user_profiles(custom_id);



