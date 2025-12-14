# 技术架构

ValPoint 采用现代化的前后端分离架构，基于 React + Supabase 构建。

## 前端架构
### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 5.x | 构建工具 |
| Tailwind CSS | 3.x | 样式框架 |
| Leaflet | 1.9.x | 地图库 |
| Lucide React | - | 图标库 |

### 目录结构

```
src/
├── components/          # React 组件
│   ├── EditorModal.tsx  # 编辑器模态框
│   ├── ViewerModal.tsx  # 查看器模态框
│   ├── LeafletMap.tsx   # 地图组件
│   ├── LeftPanel.tsx    # 左侧面板
│   ├── RightPanel.tsx   # 右侧面板
│   └── Icon.tsx         # 图标组件
│
├── hooks/               # 自定义 Hooks
│   ├── useValorantData.ts    # 地图/特工数据
│   ├── useLineups.ts         # 个人库数据
│   ├── useSharedLineups.ts   # 共享库数据
│   ├── useShareActions.ts    # 分享/复制操作
│   └── useLineupActions.ts   # CRUD 操作
│
├── utils/               # 工具函数
│   ├── authorFetcher.ts # 作者信息获取
│   ├── ossUpload.ts     # 图床上传
│   └── abilityIcons.ts  # 技能图标处理
│
├── constants/           # 常量配置
│   └── maps.ts          # 地图配置
│
├── data/                # 静态数据
│   └── ability_overrides.json  # 技能覆盖数据
│
├── services/            # 服务层
│   └── tables.ts        # 表名常量
│
├── types/               # TypeScript 类型
│   └── database.ts      # 数据库类型
│
├── lib/                 # 第三方库封装
│   └── imageCompression.ts  # 图片压缩
│
├── App.tsx              # 应用入口
├── main.tsx             # 主入口
├── index.css            # 全局样式
└── supabaseClient.ts    # Supabase 客户端
```

### 组件层次

```
App.tsx
├── LeftPanel
│   ├── MapSelector
│   ├── AgentSelector
│   └── FilterPanel
│
├── LeafletMap
│   └── Markers
│
├── RightPanel
│   ├── LineupList
│   │   └── LineupCard
│   └── ActionButtons
│
├── EditorModal
│   ├── ImageUploader
│   ├── SourceLinkInput
│   └── MapSelector
│
└── ViewerModal
    ├── ImageGallery
    └── AuthorInfo
```

### 数据流

```
用户操作
    │
    ▼
组件 (Component)
    │
    ▼
Hooks (useXxx)
    │
    ▼
Supabase Client
    │
    ▼
Supabase API
    │
    ▼
PostgreSQL / Storage / Edge Functions
    │
    ▼
返回数据
    │
    ▼
更新状态
    │
    ▼
重新渲染
```

## 后端架构

### Supabase 服务

#### PostgreSQL 数据库

**主库（个人点位）**

表：`valorant_lineups`

```sql
CREATE TABLE valorant_lineups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  map_name TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_icon TEXT,
  side TEXT CHECK (side IN ('attack', 'defense')),
  ability_index INTEGER,
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
  cloned_from UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**共享库**

表：`valorant_shared`

```sql
CREATE TABLE valorant_shared (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_id TEXT UNIQUE NOT NULL,
  source_id UUID,
  user_id UUID,
  -- 其他字段与 valorant_lineups 相同
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '15 days'
);
```

#### Row Level Security (RLS)

```sql
-- 个人库：用户只能访问自己的数据
CREATE POLICY "Users can view own lineups"
  ON valorant_lineups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lineups"
  ON valorant_lineups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lineups"
  ON valorant_lineups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lineups"
  ON valorant_lineups FOR DELETE
  USING (auth.uid() = user_id);

-- 共享库：所有人可读
CREATE POLICY "Anyone can view shared lineups"
  ON valorant_shared FOR SELECT
  USING (true);
```

#### Edge Functions

**get-video-author**

- 运行时：Deno
- 用途：解析 B 站和抖音视频作者信息
- 端点：`/functions/v1/get-video-author`
- 方法：POST
- 请求体：`{ "url": "视频链接" }`
- 响应：
  ```json
  {
    "status": "success",
    "data": {
      "username": "作者昵称",
      "avatar": "头像 URL",
      "user_home_url": "主页链接",
      "is_cover": false,
      "source": "bilibili" | "douyin"
    }
  }
  ```

## 数据库设计

### ER 图

```
┌─────────────────┐
│   auth.users    │
│  (Supabase)     │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────────────────┐
│   valorant_lineups          │
│  ─────────────────────────  │
│  id (PK)                    │
│  user_id (FK)               │
│  title                      │
│  map_name                   │
│  agent_name                 │
│  side                       │
│  stand_img                  │
│  aim_img                    │
│  land_img                   │
│  source_link                │
│  author_name                │
│  author_avatar              │
│  cloned_from                │
│  created_at                 │
│  updated_at                 │
└─────────────────────────────┘
         │
         │ 1
         │
         │ 1
┌────────▼────────────────────┐
│   valorant_shared           │
│  ─────────────────────────  │
│  id (PK)                    │
│  share_id (UNIQUE)          │
│  source_id (FK)             │
│  user_id                    │
│  ... (同 lineups 字段)      │
│  created_at                 │
│  expires_at                 │
└─────────────────────────────┘
```

### 索引设计

```sql
-- 个人库索引
CREATE INDEX idx_lineups_user_id ON valorant_lineups(user_id);
CREATE INDEX idx_lineups_map_name ON valorant_lineups(map_name);
CREATE INDEX idx_lineups_agent_name ON valorant_lineups(agent_name);
CREATE INDEX idx_lineups_created_at ON valorant_lineups(created_at DESC);

-- 共享库索引
CREATE INDEX idx_shared_share_id ON valorant_shared(share_id);
CREATE INDEX idx_shared_expires_at ON valorant_shared(expires_at);
```

## 第三方集成

### 图床服务

#### 阿里云 OSS

```typescript
import OSS from 'ali-oss';

const client = new OSS({
  accessKeyId: config.accessKeyId,
  accessKeySecret: config.accessKeySecret,
  bucket: config.bucket,
  region: config.area
});

await client.put(filename, file);
```

#### 腾讯云 COS

```typescript
import COS from 'cos-js-sdk-v5';

const cos = new COS({
  SecretId: config.secretId,
  SecretKey: config.secretKey
});

await cos.putObject({
  Bucket: `${config.bucket}-${config.appId}`,
  Region: config.area,
  Key: filename,
  Body: file
});
```

#### 七牛云 Kodo

```typescript
import * as qiniu from 'qiniu-js';

const token = getUploadToken(config);

await qiniu.upload(file, filename, token, {
  region: config.area
});
```

### 外部 API

#### Valorant API

```typescript
// 获取特工数据
const response = await fetch(
  'https://valorant-api.com/v1/agents?language=zh-CN&isPlayableCharacter=true'
);
const data = await response.json();
```

#### B 站 API

通过 Edge Function 调用：
```
https://api.bilibili.com/x/web-interface/view?bvid={bvid}
```

#### 抖音 API

通过 Edge Function 调用，使用 HTML 解析。

## 性能优化

### 前端优化

1. **代码分割**
   - Vite 自动进行路由级别的代码分割
   - 动态导入大型组件

2. **图片优化**
   - 上传时自动压缩
   - 使用 WebP 格式
   - 懒加载

3. **缓存策略**
   - LocalStorage 缓存配置
   - React Query 缓存数据
   - Service Worker（可选）

4. **渲染优化**
   - React.memo 避免不必要的渲染
   - useMemo / useCallback 优化计算
   - 虚拟滚动（大列表）

### 后端优化

1. **数据库优化**
   - 合理的索引设计
   - 查询优化（避免 N+1）
   - 连接池管理

2. **CDN 加速**
   - 静态资源 CDN
   - 图片 CDN
   - API CDN（Cloudflare）

3. **缓存策略**
   - Supabase 自动缓存
   - Edge Function 缓存
   - 浏览器缓存

## 安全设计

### 前端安全

1. **XSS 防护**
   - React 自动转义
   - 避免 dangerouslySetInnerHTML

2. **CSRF 防护**
   - Supabase JWT Token
   - SameSite Cookie

3. **敏感信息**
   - 环境变量管理
   - 不在前端存储密钥

### 后端安全

1. **RLS 权限控制**
   - 用户只能访问自己的数据
   - 共享库公开访问

2. **API 限流**
   - Supabase 自动限流
   - Edge Function 限流

3. **数据验证**
   - 前端验证
   - 后端验证（RLS + Triggers）

## 监控和日志

### 前端监控

- 错误监控：Sentry
- 性能监控：Web Vitals
- 用户行为：Google Analytics

### 后端监控

- Supabase Dashboard
- 数据库性能监控
- Edge Function 日志

## 扩展性设计

### 水平扩展

- Supabase 自动扩展
- CDN 全球分布
- 无状态设计

### 功能扩展

- 插件化架构
- 模块化设计
- 配置化管理

## 技术选型理由

| 技术 | 理由 |
|------|------|
| React | 生态成熟，组件化开发 |
| TypeScript | 类型安全，减少 Bug |
| Vite | 快速构建，HMR 体验好 |
| Supabase | 开箱即用，降低后端成本 |
| Tailwind CSS | 快速开发，样式一致 |
| Leaflet | 轻量级地图库，自定义性强 |
<!-- 
 ## 未来规划

- [ ] 移动端 App（React Native）
- [ ] 实时协作功能（Supabase Realtime）
- [ ] AI 推荐点位
- [ ] 视频上传和播放
- [ ] 社区功能（评论、点赞）
- [ ] 数据分析和统计
-->
