# VALPOINT（Vite + React + TS + Supabase）

一个用于创建、管理和分享《无畏契约》点位的单页应用，基于 Vite + React + TypeScript，数据存储在 Supabase（Postgres + Realtime）。支持攻防视角切换、技能过滤、点位分享与导入。

## 功能概览
- 地图选择：官方 API 获取地图，支持攻/防底图切换。
- 特工/技能过滤：按特工、技能、攻防侧和标题搜索。
- 点位创建：在地图上标注站位与落点，可拖拽，填写标题、说明和截图（站位/瞄点/落点）。
- 点位查看：列表 + 地图联动，高亮连线，图片灯箱查看。
- 分享与导入：生成分享链接；访问 `?id=` 进入分享视图，可一键保存到个人列表。
- 批量清理：右侧栏“一键清空我的点位”。
- 数据兼容：旧中文地图名读取时自动转为英文键。

## 数据表设计（Supabase）
推荐建表 `valorant_lineups`（snake_case 字段）：
```
id uuid primary key default gen_random_uuid(),
user_id text,
title text,
map_name text,
agent_name text,
agent_icon text,
skill_icon text,
side text,
ability_index int,
agent_pos jsonb,
skill_pos jsonb,
stand_img text, stand_desc text,
aim_img text, aim_desc text,
aim2_img text, aim2_desc text,
land_img text, land_desc text,
cloned_from text,
created_at timestamptz default now(),
updated_at timestamptz
```
RLS 示例（允许匿名用户按 user_id 读写自己的数据）：
```
-- 开启 RLS 后
create policy "anon read own"
on valorant_lineups for select
using (auth.role() = 'anon');

create policy "anon write own"
on valorant_lineups for insert
with check (auth.role() = 'anon');

create policy "anon update own"
on valorant_lineups for update using (auth.role() = 'anon');

create policy "anon delete own"
on valorant_lineups for delete using (auth.role() = 'anon');
```
（如需更严格控制，可在表中记录 user_id，并在 policy 中校验 `user_id = current_setting('request.jwt.claim.sub', true)`，并改用 Supabase Auth 登录。当前前端默认用 localStorage 生成匿名 userId。）

### 一键建表与权限（可直接点击复制）
点击复制按钮，粘贴到 Supabase 控制台 → SQL Editor 运行，即可完成建表 + RLS + 匿名策略：

```sql
create extension if not exists "uuid-ossp";
create table if not exists public.valorant_lineups (
  id uuid primary key default uuid_generate_v4(),
  user_id text,
  title text,
  map_name text,
  agent_name text,
  agent_icon text,
  skill_icon text,
  side text,
  ability_index int,
  agent_pos jsonb,
  skill_pos jsonb,
  stand_img text, stand_desc text,
  aim_img text, aim_desc text,
  aim2_img text, aim2_desc text,
  land_img text, land_desc text,
  cloned_from text,
  created_at timestamptz default now(),
  updated_at timestamptz
);
alter table public.valorant_lineups enable row level security;
drop policy if exists "anon select" on public.valorant_lineups;
create policy "anon select" on public.valorant_lineups for select using (auth.role() = 'anon');
drop policy if exists "anon insert" on public.valorant_lineups;
create policy "anon insert" on public.valorant_lineups for insert with check (auth.role() = 'anon');
drop policy if exists "anon update" on public.valorant_lineups;
create policy "anon update" on public.valorant_lineups for update using (auth.role() = 'anon');
drop policy if exists "anon delete" on public.valorant_lineups;
create policy "anon delete" on public.valorant_lineups for delete using (auth.role() = 'anon');
```

## 环境准备
- Node.js 18+（推荐 LTS）
- npm（或 pnpm/yarn，脚本以 npm 为例）
- 必填环境变量：
  - `VITE_SUPABASE_URL`（例如 https://xxxx.supabase.co）
  - `VITE_SUPABASE_ANON_KEY`（Supabase anon 公钥）

## 本地开发
```bash
npm install

# 项目根目录创建 .env.local（已 gitignore），填入：
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

npm run dev               # http://localhost:5173
# 如需局域网：npm run dev -- --host
```

## 构建与预览
```bash
npm run build    # 生成 dist/
npm run preview  # 预览打包产物
```

## 部署
- 静态托管即可（Vercel、Netlify、Cloudflare Pages、S3 等），部署时配置环境变量：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- 确保 Supabase 表已创建，并设置合适的 RLS 规则。

## 代码结构
- `src/main.tsx`：入口
- `src/App.tsx`：核心页面与业务逻辑（地图、特工、过滤、CRUD、分享）
- `src/supabaseClient.ts`：Supabase 初始化（读取环境变量）
- `src/constants/maps.ts`：地图底图 URL 与中英映射
- `src/components/*`：地图、左右侧栏、弹窗、图标等 UI 组件

## 常用操作
- 创建点位：地图标注“站位/落点” → 填写详情 → 保存。
- 分享：列表卡片右上角“分享”复制链接。
- 导入：左上“导入链接”输入分享链接/ID，或直接访问 `?id=<rowId>`。
- 清空：右侧栏底部“一键清空我的点位”（仅删除当前 user_id 的数据）。
