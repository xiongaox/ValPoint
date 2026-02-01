# ValPoint 本地化重构设计文档

> **日期**：2026-02-01  
> **目标**：将 ValPoint 从 Supabase 云服务迁移到完全本地化的 Docker 部署方案

---

## 1. 项目背景

ValPoint 是一个 Valorant 点位收集工具，目前依赖 Supabase 提供后端服务（数据库、认证、存储、Edge Functions）。本次重构的目标是将其完全本地化，实现：

- **零云服务依赖**：不需要任何外部 API 或云平台
- **单容器部署**：Docker 一键启动
- **数据自主可控**：所有数据存储在本地

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Container                         │
│                     (valpoint_s:3209)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐     ┌──────────────────────────┐  │
│  │      Nginx          │────▶│    /data/images/         │  │
│  │   (静态资源代理)     │     │    (图片文件存储)         │  │
│  └──────────┬──────────┘     └──────────────────────────┘  │
│             │                                               │
│             ▼ /api/*                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Node.js (Express)                          ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  ││
│  │  │Lineups  │ │ Images  │ │ Proxy   │ │    Stats     │  ││
│  │  │  API    │ │  API    │ │(B站/抖音)│ │    API       │  ││
│  │  └────┬────┘ └────┬────┘ └─────────┘ └──────────────┘  ││
│  │       │           │                                     ││
│  │       ▼           ▼                                     ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │               SQLite Database                    │   ││
│  │  │         /data/valpoint.db                        │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**架构要点**：
1. **单容器部署**：Nginx + Node.js 运行在同一个 Docker 容器中
2. **Nginx 职责**：静态文件托管（前端 + 图片）、反向代理 API 请求到 Node.js
3. **Node.js 职责**：提供 RESTful API、操作 SQLite、处理图片格式转换
4. **数据持久化**：`/data` 目录挂载为 Docker Volume，包含数据库和图片

---

## 3. 数据模型

### `lineups` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PRIMARY KEY | UUID 主键 |
| `title` | TEXT | 点位标题 |
| `map_name` | TEXT | 地图名称 |
| `agent_name` | TEXT | 英雄名称 |
| `side` | TEXT | 攻/防方 (attack/defense) |
| `ability_index` | INTEGER | 技能索引 |
| `agent_pos` | TEXT (JSON) | 英雄站位坐标 |
| `skill_pos` | TEXT (JSON) | 技能落点坐标 |
| `stand_img` | TEXT | 站位图路径 |
| `stand_desc` | TEXT | 站位描述 |
| `stand2_img` | TEXT | 站位图2路径 |
| `stand2_desc` | TEXT | 站位描述2 |
| `aim_img` | TEXT | 瞄准图路径 |
| `aim_desc` | TEXT | 瞄准描述 |
| `aim2_img` | TEXT | 瞄准图2路径 |
| `aim2_desc` | TEXT | 瞄准描述2 |
| `land_img` | TEXT | 落点图路径 |
| `land_desc` | TEXT | 落点描述 |
| `source_link` | TEXT | 来源链接 |
| `author_name` | TEXT | 作者名称 |
| `author_avatar` | TEXT | 作者头像（本地路径） |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 更新时间 |

**简化要点**：
- 移除所有用户相关字段（`user_id`、`creator_id`、`cloned_from`）
- 图片路径格式：`/data/images/{map}/{agent}_{skill}_{uuid}.webp`

---

## 4. API 设计

### RESTful 接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/lineups` | GET | 获取点位列表（支持 ?map=&agent= 筛选） |
| `/api/lineups/:id` | GET | 获取单个点位详情 |
| `/api/lineups` | POST | 创建新点位 |
| `/api/lineups/:id` | PUT | 更新点位 |
| `/api/lineups/:id` | DELETE | 删除点位 |
| `/api/upload` | POST | 上传图片（自动转 WebP） |
| `/api/stats` | GET | 获取点位统计数据 |
| `/api/proxy/bilibili` | GET | 代理获取 B站作者信息 |
| `/api/proxy/douyin` | GET | 代理获取抖音作者信息 |

### 图片上传流程

```
用户粘贴/选择图片
       ↓
前端 FormData 发送到 /api/upload
       ↓
Node.js 接收并用 sharp 转换为 WebP（无压缩）
       ↓
保存到 /data/images/{map}/{agent}_{skill}_{uuid}.webp
       ↓
返回图片相对路径给前端
```

---

## 5. 需要删除的模块

| 类别 | 文件/目录 | 说明 |
|------|-----------|------|
| **用户系统** | `src/apps/admin/` | 管理后台应用 |
| **用户系统** | 登录相关组件 | 登录页、注册页、用户菜单 |
| **Supabase** | `src/supabaseClient.ts` | Supabase 客户端 |
| **Supabase** | `@supabase/supabase-js` | npm 依赖 |
| **图床SDK** | `ali-oss`, `cos-js-sdk-v5`, `qiniu-js` | 云存储 SDK |
| **图床类型** | `src/types/imageBed.ts` | 图床类型定义 |
| **共享库** | `shareSupabase` 相关逻辑 | 共享库功能 |

---

## 6. 新增功能

### 6.1 点位统计弹窗

新增弹窗组件显示：
- 每个英雄的点位数量
- 每张地图的点位数量
- 总点位数

### 6.2 本地头像选择

- 预置 20 个头像文件：`/public/avatars/avatar_01.webp` ~ `avatar_20.webp`
- 用户可手动选择或系统随机分配

---

## 7. Docker 配置

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制构建产物
COPY dist/ ./dist/
COPY server/ ./server/
COPY public/avatars/ ./public/avatars/

# 数据卷
VOLUME /data

# 端口
EXPOSE 3209

# 启动
CMD ["node", "server/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  valpoint:
    image: valpoint_s
    container_name: valpoint
    ports:
      - "3209:3209"
    volumes:
      - valpoint_data:/data
    restart: unless-stopped

volumes:
  valpoint_data:
```

---

## 8. 验证计划

### 8.1 自动化测试
- 暂无现有测试，建议后续补充 API 接口测试

### 8.2 手动验证
1. **Docker 构建**：`docker build -t valpoint_s .`
2. **容器启动**：`docker run -p 3209:3209 valpoint_s`
3. **功能测试**：
   - 访问 `http://localhost:3209` 确认前端加载
   - 创建/编辑/删除点位
   - 上传图片并确认 WebP 转换
   - 查看点位统计弹窗
   - 测试 B站/抖音作者信息获取

---

## 9. 实施步骤概览

1. **Phase 1**：创建后端服务框架 (`server/`)
2. **Phase 2**：实现 SQLite 数据层
3. **Phase 3**：实现 API 路由
4. **Phase 4**：删除 Supabase 相关代码
5. **Phase 5**：修改前端 Service 层调用本地 API
6. **Phase 6**：实现图片上传和 WebP 转换
7. **Phase 7**：实现 B站/抖音代理
8. **Phase 8**：新增点位统计弹窗
9. **Phase 9**：Docker 构建和测试
