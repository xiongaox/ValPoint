-- ==========================================
-- Supabase 数据库一键重建脚本 (DDL)
-- ==========================================

-- 1. 基础配置与通用函数
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 自动更新 updated_at 的函数
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;   
END;
$$ language 'plpgsql';

-- 2. 用户配置体系
-- 创建角色枚举
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建用户配置表
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nickname TEXT,
    avatar TEXT,
    custom_id TEXT UNIQUE,
    role user_role DEFAULT 'user',
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    download_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 注册触发器函数：当 auth.users 插入时，自动同步到 public.user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nickname, custom_id, avatar, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nickname', ''),
    COALESCE(new.raw_user_meta_data->>'custom_id', ''),
    COALESCE(new.raw_user_meta_data->>'avatar', ''),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建注册触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 点位库 (个人/共享/审核)

-- 个人点位库
CREATE TABLE IF NOT EXISTS public.valorant_lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    map_name TEXT,
    agent_name TEXT,
    agent_icon TEXT,
    skill_icon TEXT,
    side TEXT,
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
    author_uid TEXT, -- 这里保留旧的 custom_id 引用，用于显示
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 共享中心库
CREATE TABLE IF NOT EXISTS public.valorant_shared (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source_id UUID,  -- 投稿来源 ID (来自 lineup_submissions)
    user_id TEXT,    -- 用户显示标识 (邮箱或自定义ID)
    title TEXT,
    map_name TEXT,
    agent_name TEXT,
    agent_icon TEXT,
    skill_icon TEXT,
    side TEXT,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 点位投稿审核表
CREATE TABLE IF NOT EXISTS public.lineup_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    submitter_email TEXT,
    title TEXT,
    map_name TEXT,
    agent_name TEXT,
    agent_icon TEXT,
    skill_icon TEXT,
    side TEXT,
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
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    reject_reason TEXT,
    reviewed_by TEXT, -- 审核者标识（移除外键约束，跨项目兼容）
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 系统配置表（全局单行配置）
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    personal_library_url TEXT DEFAULT '',
    shared_library_url TEXT DEFAULT '',
    official_oss_config JSONB DEFAULT NULL,       -- 官方图床配置
    submission_enabled BOOLEAN DEFAULT false,      -- 是否开启投稿
    daily_submission_limit INTEGER DEFAULT 10,     -- 每日投稿限制
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入初始配置行
INSERT INTO public.system_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 5. 自动化触发器 (updated_at)
CREATE TRIGGER tr_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER tr_valorant_lineups_updated_at BEFORE UPDATE ON public.valorant_lineups FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER tr_valorant_shared_updated_at BEFORE UPDATE ON public.valorant_shared FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER tr_lineup_submissions_updated_at BEFORE UPDATE ON public.lineup_submissions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER tr_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 6. RLS 安全策略 (Row Level Security)

-- 启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valorant_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valorant_shared ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- (1) 用户中心策略
CREATE POLICY "用户可查看任何人但仅修改本人 Profile" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.uid() = id);

-- (2) 个人点位库策略：仅限本人增删改查
CREATE POLICY "个人点位仅限本人操作" ON public.valorant_lineups
    FOR ALL USING (auth.uid() = user_id);

-- (3) 共享库策略：全站可见，管理员或本人可操作
CREATE POLICY "共享库全员可见" ON public.valorant_shared FOR SELECT USING (true);
CREATE POLICY "仅管理员或提交者可操作共享点位" ON public.valorant_shared
    FOR ALL USING (
        auth.uid() = submitter_id OR 
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- (4) 投稿审核策略
CREATE POLICY "提交者可查看自己的投稿" ON public.lineup_submissions FOR SELECT USING (auth.uid() = submitter_id);
CREATE POLICY "提交者可创建投稿" ON public.lineup_submissions FOR INSERT WITH CHECK (auth.uid() = submitter_id);
CREATE POLICY "提交者可删除自己的投稿" ON public.lineup_submissions FOR DELETE USING (auth.uid() = submitter_id);
CREATE POLICY "提交者可撤回待审投稿" ON public.lineup_submissions FOR UPDATE USING (auth.uid() = submitter_id AND status = 'pending') WITH CHECK (auth.uid() = submitter_id);
CREATE POLICY "审核员可查看和更新投稿" ON public.lineup_submissions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- (5) 系统配置策略：已认证用户可读，仅管理员可修改
CREATE POLICY "系统配置全员可读" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "仅管理员可修改系统配置" ON public.system_settings
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- 7. 索引优化 (提高查询效率)
CREATE INDEX IF NOT EXISTS idx_lineups_user_id ON public.valorant_lineups(user_id);
CREATE INDEX IF NOT EXISTS idx_lineups_map_agent ON public.valorant_lineups(map_name, agent_name);
CREATE INDEX IF NOT EXISTS idx_shared_map_agent ON public.valorant_shared(map_name, agent_name);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.lineup_submissions(status);
CREATE INDEX IF NOT EXISTS idx_profiles_custom_id ON public.user_profiles(custom_id);

-- 8. Storage 配置 (投稿图片存储)

-- (1) 创建 submissions bucket（需要在 Supabase Dashboard 中手动创建为 Public bucket）
-- 注意: bucket 创建不能通过 SQL 完成，需要在 Dashboard 或使用 Supabase Admin API
-- 在 Storage 中创建名为 'submissions' 的 Public bucket

-- (2) Storage RLS 策略
-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can upload own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public can view submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own submissions" ON storage.objects;

-- 允许认证用户上传到自己的文件夹
CREATE POLICY "Users can upload own submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'submissions' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许所有人查看 submissions bucket（公开访问）
CREATE POLICY "Public can view submissions"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'submissions');

-- 允许用户删除自己上传的文件 或 管理员删除任何文件
CREATE POLICY "Users can delete own submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'submissions' AND 
    (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    )
);
