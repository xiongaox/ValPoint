-- 创建用户档案表（与 auth.users 同步）
-- 用于管理后台查看和管理用户

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    custom_id TEXT,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_custom_id ON user_profiles(custom_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_banned ON user_profiles(is_banned);

-- 创建触发器：新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, nickname, avatar, custom_id, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nickname', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar', ''),
        COALESCE(NEW.raw_user_meta_data->>'custom_id', ''),
        NEW.created_at
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧触发器（如存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 创建触发器：用户更新 metadata 时同步到 profile
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles
    SET 
        email = NEW.email,
        nickname = COALESCE(NEW.raw_user_meta_data->>'nickname', nickname),
        avatar = COALESCE(NEW.raw_user_meta_data->>'avatar', avatar),
        custom_id = COALESCE(NEW.raw_user_meta_data->>'custom_id', custom_id),
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧触发器（如存在）
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- 创建更新触发器
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_user_update();

-- RLS 策略
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 管理员可以读取所有用户
CREATE POLICY "admins_can_read_all" ON user_profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- 管理员可以更新用户状态（禁用/解禁等）
CREATE POLICY "admins_can_update" ON user_profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- 用户可以读取自己的档案
CREATE POLICY "users_can_read_own" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- 用户可以更新自己的部分信息（nickname, avatar）
CREATE POLICY "users_can_update_own" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 回填现有用户到 user_profiles 表
INSERT INTO user_profiles (id, email, nickname, avatar, custom_id, created_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'nickname', ''),
    COALESCE(raw_user_meta_data->>'avatar', ''),
    COALESCE(raw_user_meta_data->>'custom_id', ''),
    created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = COALESCE(EXCLUDED.nickname, user_profiles.nickname),
    avatar = COALESCE(EXCLUDED.avatar, user_profiles.avatar),
    custom_id = COALESCE(EXCLUDED.custom_id, user_profiles.custom_id),
    updated_at = NOW();
