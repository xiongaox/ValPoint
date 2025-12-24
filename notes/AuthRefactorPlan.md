# 身份认证重构与数据表精简方案 (Auth Refactoring Plan)

**日期**: 2025-12-25
**状态**: 待实施 (Pending)
**目标**: 统一全站身份认证体系，精简数据库表结构，引入隐私保护的随机短 ID。

---

## 1. 核心目标

1.  **统一认证**: 废弃旧的 `valorant_users`（自定义账号表），全站（个人库、共享库、管理后台）统一使用 **Supabase Auth**（邮箱/密码）。
2.  **数据精简**: 移除冗余的 `valorant_users` 表。
3.  **隐私保护**: 引入 **随机短 ID** (`custom_id`，如 `78O1HR34`) 用于对外展示，替代可以直接关联到个人的邮箱或过长的 UUID。

---

## 2. 数据库变更设计

### 2.1 删除旧表
*   **[DELETE]** `valorant_users`: 完全删除。
    *   *迁移注意*: 如果有老用户的个人点位数据需要保留，需提前记录其旧 ID 与新注册 Supabase UUID 的映射关系，进行数据迁移。

### 2.2 改造现有表
*   **[MODIFY]** `valorant_lineups` (个人点位表):
    *   `user_id` 字段类型保持不可变（通常为 String），但其**值的内容**将从原来的 "自定义账号ID" 变更为 "Supabase User UUID"。
    *   启用 RLS (Row Level Security)，确保用户只能读取/修改 `user_id = auth.uid()` 的数据。

*   **[KEEP]** `user_profiles` (用户资料表):
    *   保留现有结构。
    *   **[NEW]** 确保 `custom_id` 字段存在且必须添加 **唯一索引 (Unique Index)**，从数据库层面物理拦截重复。

---

## 3. 业务逻辑变更

### 3.1 随机短 ID 生成策略 (Random Short ID)
用户注册时，不再直接暴露邮箱或 UUID，而是自动生成一个 8 位随机字符串作为对外 ID。

**核心要求**: 全局唯一，绝对不可重复。

**生成规则代码示例 (TypeScript)**:
```typescript
function generateShortId(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符 I,1,O,0
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 伪代码：确保唯一性
async function generateUniqueId() {
    let isUnique = false;
    let newId = '';
    while (!isUnique) {
        newId = generateShortId();
        // 查库确认是否已存在
        const { data } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('custom_id', newId)
            .maybeSingle();
        
        if (!data) isUnique = true; // 未找到重复，可用
    }
    return newId;
}
```

### 3.2 注册流程改造 (`src/hooks/useEmailAuth.ts`)
修改 `signUpWithEmail` 函数：
1.  调用 Supabase 注册接口创建 Auth 用户。
2.  注册成功后，在前端（或通过 Supabase Database Webhook）生成 `custom_id`。
3.  将 `custom_id` 写入 `user_profiles` 表。

### 3.3 个人库改造
1.  **移除** `src/services/users.ts` 所有逻辑。
2.  **修改** `src/apps/user/UserApp.tsx`:
    *   移除旧的登录/注册弹窗。
    *   使用 `useEmailAuth` 检查登录状态。
    *   未登录时显示与共享库一致的登录界面，或者直接复用 `SharedLoginPage`。
    *   登录成功后，Supabase Client 会自动维护 `localStorage` Session，实现"一次登录，永久有效"。

---

## 4. 实施任务清单 (Task List)

### Phase 1: 准备工作
- [ ] **数据库备份**: 导出所有现有数据，防止迁移失误。
- [ ] **Schema 变更**:
    - [ ] 确保 `user_profiles` 有 `custom_id` 字段。
    - [ ] 为 `user_profiles.custom_id` 添加唯一索引。

### Phase 2: 代码开发
- [ ] **工具函数**:
    - [ ] 在 `src/lib` 下创建 ID 生成工具（排除易混淆字符）。
- [ ] **Hooks 升级 (`useEmailAuth.ts`)**:
    - [ ] 注册成功后自动生成并写入 `custom_id`。
    - [ ] `updateProfile` 支持更新 `custom_id`（可选，或禁止用户自行修改）。
- [ ] **UI 适配**:
    - [ ] 全局搜索用户展示组件（如 `UserAvatar`, `CompactUserCard`），优先显示 `custom_id`。
    - [ ] 共享点位详情页：作者名字显示 `custom_id`。
- [ ] **个人库迁移**:
    - [ ] 替换 `UserApp` 的认证逻辑为 Supabase Auth。
    - [ ] 移除 `valorant_users` 相关代码。

### Phase 3: 数据清理
- [ ] **SQL 执行**:
    - [ ] `DROP TABLE valorant_users;`

---

## 5. 常见问题 (Q&A)

**Q: 随机生成的 ID 会重复吗？**
A: 8位 Base32 变体（32个字符）的空间即便在百万级用户下重复概率也极低。但为了保险，在写入数据库时若捕获"唯一约束冲突"错误，应自动重新生成并重试一次。

**Q: 只有个人库变成了邮箱登录，以前的数据怎么办？**
A: 这是一个**破坏性变更**。
*   *方案 A (简单)*: 以前的数据作为"游客数据"遗弃，用户需重新录入。
*   *方案 B (平滑)*: 提供一个"旧账号迁移"工具。用户先登录新邮箱账号，然后输入旧账号密码，系统在后台将旧表中的数据 `user_id` 批量更新为新账号的 UUID。
