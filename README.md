<div align="center" style="margin-bottom:12px;">
  <img src="docs/public/logo.svg" alt="ValPoint Logo" width="120">
</div>

<div align="center">
  <h1 style="font-size:3rem;font-weight:bold;margin:1.5rem 2rem 1.5rem 2rem;color:#ff4655;">VALPOINT</h1>
</div>

<div align="center" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:8px;">
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Cloud-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
</div>

<div align="center" style="margin-top:16px;">
  <a href="http://valpoint.cn">🌐 官网</a> &nbsp;|&nbsp;
  <a href="valpoint.cff1f4ee.er.aliyun-esa.net">🔗 备用1【阿里云ESA】</a> &nbsp;|&nbsp;
  <a href="https://valpoint.vercel.app">🔗 备用2【Vercel】</a> &nbsp;|&nbsp;
  <a href="https://valpoint.xiongaox.workers.dev">🔗 备用3【Cloudflare】</a> &nbsp;|&nbsp;
  <a href="http://valpoint.cn/wiki/">📖 查看文档</a>
</div>

---

🎯 **ValPoint** 是一个专为 Valorant 玩家打造的点位管理与分享平台。支持多地图标注、技能点位收藏、视频来源追踪、作者信息自动获取等功能，让你的游戏技巧管理更加高效。

![banner](docs/public/plate/banner.jpg)

---

## ✨ 功能特性

### 🎮 三大功能模块

| 模块 | 说明 |
|------|------|
| **个人库** | 管理您的私有点位数据，支持新增、编辑、删除、导入导出 |
| **共享库** | 浏览公共点位，一键保存到个人库，支持图片自动迁移 |
| **管理后台** | 用户管理、投稿审核、数据统计、系统设置 |

![个人库-首页](docs/public/plate/个人库-首页.jpg)

![共享库-首页](docs/public/plate/共享库-首页.jpg)

![后台-仪表盘](docs/public/plate/后台-仪表盘.jpg)

### 🧩 核心功能

- **点位管理**：创建 / 编辑 / 删除站位、瞄点、落点配图与描述
- **保存点位**：从共享库保存点位到个人库，仅限同一项目内操作
- **下载点位**：从共享库下载点位到个人库，支持跨项目操作
- **多视角筛选**：按地图、英雄、技能、阵营（进攻/防守）筛选
- **作者信息自动获取**：支持 B 站、抖音视频链接，自动解析作者头像和昵称
- **精准空降**：点击跳转到视频的具体时间点
- **图床配置**：支持阿里云 OSS、腾讯云 COS、七牛云 Kodo
- **图片自动迁移**：从共享库保存点位时，自动将图片迁移到个人图床
- **批量下载**：将点位打包为 ZIP 下载到本地
- **批量导入**：支持导入 ZIP 格式的点位包
- **移动端适配**：手机端可流畅浏览点位

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite 5 + Tailwind CSS |
| **地图** | Leaflet + React-Leaflet |
| **后端** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **图床** | 阿里云 OSS / 腾讯云 COS / 七牛云 Kodo |
| **部署** | Docker / Vercel / Cloudflare Pages |

---

## 🚀 快速开始

> 📖 完整教程请查阅 [在线文档](http://valpoint.cn/wiki/guide/快速开始)

```bash
# 克隆项目
git clone https://github.com/xiongaox/ValPoint.git
cd ValPoint

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Supabase 配置

# 启动开发服务器
npm run dev
```

---

## 📁 项目结构

```
ValPoint/
├── src/
│   ├── apps/                 # MPA 多入口应用
│   │   ├── admin/            # 管理后台
│   │   ├── shared/           # 共享库
│   │   └── user/             # 个人库
│   ├── components/           # 通用组件
│   ├── features/             # 业务功能模块
│   ├── hooks/                # 自定义 Hooks
│   ├── services/             # API 服务层
│   └── utils/                # 工具函数
├── docs/                     # VitePress 文档
├── public/                   # 静态资源
├── functions/                # Supabase Edge Functions
├── Dockerfile                # Docker 镜像构建
├── docker-compose.yml        # Docker Compose 编排
└── nginx.conf                # Nginx 配置
```

---

## 🚢 部署方式

### ⚡ 一键部署

#### Vercel（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xiongaox/ValPoint&project-name=valpoint&repository-name=valpoint&env=VITE_SUPABASE_ANON_KEY,VITE_SUPABASE_URL)

#### Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/?to=/:account/pages/new)

#### Docker

```yaml
services:
  valpoint:
    image: xiongaox7806/valpoint-a:latest
    restart: always
    ports:
      - "3208:3208"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
```

```bash
docker compose up -d
```

> 📖 详细教程请查阅 [部署指南](http://valpoint.cn/wiki/guide/部署指南)

---

## 📖 文档导航

<div align="center">

| 用户指南 | 开发文档 |
|:--------:|:--------:|
| [使用流程](http://valpoint.cn/wiki/guide/使用流程) | [项目概览](http://valpoint.cn/wiki/dev/项目概览) |
| [个人库详解](http://valpoint.cn/wiki/guide/个人库功能详解) | [技术架构](http://valpoint.cn/wiki/dev/技术架构) |
| [共享库详解](http://valpoint.cn/wiki/guide/共享库功能详解) | [开发规范](http://valpoint.cn/wiki/dev/开发规范) |
| [后台详解](http://valpoint.cn/wiki/guide/后台详解) | [作者信息解析](http://valpoint.cn/wiki/dev/作者信息解析) |
| [图床配置](http://valpoint.cn/wiki/guide/图床配置) | |
| [数据库建表](http://valpoint.cn/wiki/guide/数据库建表) | |

</div>

---

## 🗺️ 未来计划

- ⬜ 平板端适配
- ⬜ 基于 SQLite 的本地 Docker 版本
- ⬜ 云存储同步（WebDAV / S3）

> 📖 详情请查阅 [未来计划](http://valpoint.cn/wiki/guide/未来计划)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- [Valorant API](https://valorant-api.com/) - 英雄和地图数据
- [Supabase](https://supabase.com/) - 后端服务
- [Leaflet](https://leafletjs.com/) - 地图库
- [Lucide](https://lucide.dev/) - 图标库

---

<div align="center">
  <p>Made with ❤️ for Valorant Players</p>
  <p>⭐ 如果这个项目对你有帮助，请给个 Star！</p>
</div>
