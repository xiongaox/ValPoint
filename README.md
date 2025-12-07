# VALPOINT

Valorant 点位规划工具（Vite + React + TypeScript + Supabase）。

## 功能概览
- 创建/管理/分享点位：站位、瞄点、落点配图与说明。
- 支持攻/防视角、特工技能筛选、自定义地图底图切换。
- 点位分享：生成分享 ID，其他人可预览；可一键保存到个人库。
- 轻量多用户：前端自定义 8 位 ID 作为“账号”，跨设备同步。

## 环境要求
- Node.js 18+（建议 LTS）
- npm（或 pnpm/yarn，脚本示例使用 npm）

## 环境变量
复制 `.env.example` 为 `.env` / `.env.local` 并填写：
```env
# 个人数据仓 Supabase（必填）
VITE_SUPABASE_URL=...your supabase url...
VITE_SUPABASE_ANON_KEY=...your anon key...

# 公共分享中转仓（可使用提供的公共库，或换成自己的公共项目）
VITE_SUPABASE_SHARE_URL=https://dhkmniuzmifvuozbhfhg.supabase.co
VITE_SUPABASE_SHARE_ANON_KEY=sb_publishable_3UBYzGE1w5z3cSb5cMfM1Q_ilKneWlM
```
说明：anon/publishable key 可以公开，但不要提交 `.env`；部署时在平台环境变量里填写。

## 数据库表设计
### 个人点位表 `valorant_lineups`
```sql
create table if not exists public.valorant_lineups (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  title           text not null,
  map_name        text not null,
  agent_name      text not null,
  agent_icon      text,
  skill_icon      text,
  side            text not null default 'attack',          -- attack / defense
  ability_index   int,
  agent_pos       jsonb,                                   -- {lat,lng}
  skill_pos       jsonb,                                   -- {lat,lng}
  stand_img       text,
  stand_desc      text,
  stand2_img      text,
  stand2_desc     text,
  aim_img         text,
  aim_desc        text,
  aim2_img        text,
  aim2_desc       text,
  land_img        text,
  land_desc       text,
  source_link     text,
  cloned_from     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```
RLS 示例（允许匿名读写；如需严格隔离可改为 `user_id = auth.uid()` 并开启 Auth）：
```sql
alter table public.valorant_lineups enable row level security;
create policy "anon select" on public.valorant_lineups for select using (auth.role() = 'anon');
create policy "anon insert" on public.valorant_lineups for insert with check (auth.role() = 'anon');
create policy "anon update" on public.valorant_lineups for update using (auth.role() = 'anon');
create policy "anon delete" on public.valorant_lineups for delete using (auth.role() = 'anon');
```

### 分享中转表 `valorant_shared`
```sql
create table if not exists public.valorant_shared (
  share_id        text primary key,
  source_id       uuid,
  id              uuid default gen_random_uuid(),
  user_id         text,
  title           text not null,
  map_name        text not null,
  agent_name      text not null,
  agent_icon      text,
  skill_icon      text,
  side            text not null default 'attack',
  ability_index   int,
  agent_pos       jsonb,
  skill_pos       jsonb,
  stand_img       text,
  stand_desc      text,
  stand2_img      text,
  stand2_desc     text,
  aim_img         text,
  aim_desc        text,
  aim2_img        text,
  aim2_desc       text,
  land_img        text,
  land_desc       text,
  source_link     text,
  cloned_from     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.valorant_shared enable row level security;
create policy "anon select shared" on public.valorant_shared for select using (auth.role() = 'anon');
create policy "anon insert shared" on public.valorant_shared for insert with check (auth.role() = 'anon');
create policy "anon update shared" on public.valorant_shared for update using (auth.role() = 'anon');
create policy "anon delete shared" on public.valorant_shared for delete using (auth.role() = 'anon');
```

### 用户表 `valorant_users`
```sql
create table if not exists public.valorant_users (
  user_id    text primary key,
  password   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 索引与增量补丁
```sql
create index if not exists idx_lineups_user_created_at on public.valorant_lineups (user_id, created_at desc);
create index if not exists idx_shared_source on public.valorant_shared (source_id);

-- 若已有旧表，补充新字段
alter table public.valorant_lineups
  add column if not exists stand2_img text,
  add column if not exists stand2_desc text;
alter table public.valorant_shared
  add column if not exists stand2_img text,
  add column if not exists stand2_desc text;
```

## 快速开始
```bash
npm install
cp .env.example .env   # 或手动创建 .env/.env.local 并填入变量
npm run dev            # http://localhost:5173
```

## 构建与预览
```bash
npm run build   # 产物在 dist/
npm run preview
```

## 部署
- Vercel/静态托管：构建命令 `npm run build`，输出目录 `dist/`，在平台配置环境变量。
- Cloudflare Pages + wrangler：已提供 `wrangler.toml`（assets 模式，目标 `dist/`），命令 `npx wrangler deploy`。

## 前端架构
- 框架：Vite + React + TypeScript
- 状态：React hooks，本地存 8 位 userId；校验写入持 userId 隔离
- 数据层：`supabase`（个人库）与 `shareSupabase`（公共分享库）
- 核心组件：`App.tsx`（业务流/状态/Supabase CRUD/分享）、`LeafletMap`（地图底图与点位标注）、`LeftPanel`/`RightPanel`（筛选/创建/列表/分享删除/分页）、各类 Modal（地图选择、预览、编辑、删除确认、提示灯箱等）

## 分享流程（公共中转库）
1) 个人表点位 -> 点击分享：生成短 ID（取 UUID 后两段），写入 `valorant_shared`。  
2) 访问分享：按 share_id 先查公共库；缺失则回退查个人表（兼容旧链接）。  
3) “保存到我的点位”：从分享数据克隆到当前用户个人表。  

## 小贴士
- 自定义 ID：输入 8 位字母数字（不区分大小写）即可跨设备查看自己的数据。
- 分页：列表超过 8 条时出现上下页。
- 不要提交 `.env`，仅提交 `.env.example`。公共分享库 anon key 可公开，service_role 等私钥绝不可放前端。
