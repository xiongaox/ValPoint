-- 真正删除用户的 RPC 函数
-- 注意：这会完全删除用户账户和相关数据

-- 首先，为 user_profiles 添加 DELETE 策略
CREATE POLICY "admins_can_delete" ON user_profiles
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- 创建删除用户的函数
-- 使用 SECURITY DEFINER 以 admin 权限执行
CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    caller_is_admin BOOLEAN;
BEGIN
    -- 检查调用者是否为管理员
    SELECT EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    ) INTO caller_is_admin;
    
    IF NOT caller_is_admin THEN
        RAISE EXCEPTION 'Permission denied: Only admins can delete users';
    END IF;
    
    -- 防止删除自己
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;
    
    -- 防止删除超级管理员
    IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = target_user_id AND role = 'super_admin') THEN
        RAISE EXCEPTION 'Cannot delete super admin';
    END IF;
    
    -- 删除 user_profiles 记录（会级联删除）
    DELETE FROM user_profiles WHERE id = target_user_id;
    
    -- 从 auth.users 删除用户（需要 SECURITY DEFINER）
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授权执行权限给已认证用户
GRANT EXECUTE ON FUNCTION delete_user_completely TO authenticated;
