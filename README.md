# ValPoint (Docker Local Version)

ValPoint 是一个专业的《无畏契约/瓦罗兰特》点位分享与管理平台。
**此版本为 Docker 本地化特别版**，旨在提供完全独立、隐私安全且易于部署的私有化点位库解决方案。

![Licence](https://img.shields.io/github/license/xiongaox/ValPoint)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![Node](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)
![SQLite](https://img.shields.io/badge/Database-SQLite-07405E?logo=sqlite)

## ✨ 核心特性

- **🔒 全本地化数据**: 彻底移除对 Supabase、Vercel 等公有云服务的依赖。所有数据（包括点位图片、用户数据）均存储在本地 SQLite 数据库和文件系统中。
- **🐳 Docker 一键部署**: 基于 Docker Compose 的容器化架构，环境隔离，开箱即用。
- **⚡ 高性能架构**: 
  - 前端：Vite + React + TailwindCSS
  - 后端：Node.js (Express) + SQLite + Sharp (图片处理)
- **📂 持久化存储**: 数据挂载于宿主机 `/data` 目录，方便备份与迁移。
- **🛠️ 完整功能**: 支持点位上传、筛选、编辑、多图预览、视频链接解析等核心功能。

## 🚀 快速开始

### 前置要求

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 部署步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-repo/ValPoint.git
   cd ValPoint
   ```

2. **创建 `docker-compose.yml` 文件**
   ```yaml
   services:
     valpoint:
       image: xiongaox7806/valpoint_s:latest
       container_name: valpoint
       ports:
         - "3209:3209"
       volumes:
         - valpoint_data:/data
       environment:
         - NODE_ENV=production
         - PORT=3209
         - DATA_DIR=/data
       restart: unless-stopped
       healthcheck:
         test: ["CMD", "wget", "-q", "--spider", "http://localhost:3209/api/health"]
         interval: 30s
         timeout: 10s
         retries: 3
         start_period: 10s

   volumes:
     valpoint_data:
       name: valpoint_data
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

3. **访问应用**
   打开浏览器访问: `http://localhost:3209`

   > **注意**: 本地版默认为 **单用户管理员模式**。
   > 为了简化部署体验，您直接拥有完整的管理权限（新增/编辑/删除点位）。
   > 如需公网访问，建议配合 Nginx Basic Auth 或 Cloudflare Access 进行安全防护。

### ⚠️ HTTP 环境下剪贴板功能

由于浏览器安全策略限制，剪贴板 API 仅在 **HTTPS 或 localhost** 环境下可用。

如果您通过 HTTP 访问云服务器（如 `http://192.168.x.x` 或公网 IP），剪贴板粘贴图片功能将不可用。

**临时解决方案（仅限 Chrome）**：

1. 在地址栏输入：`chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. 在输入框中填入您的 HTTP 地址（例如 `http://192.168.1.100:3209`）
3. 将状态改为 **Enabled**
4. 点击 **Relaunch** 重启浏览器

> **长期方案**：建议配置 HTTPS（如 Let's Encrypt + Nginx 反向代理）。

## 📂 目录结构与数据

建议定期备份 `/data` 目录，以防数据丢失。

```text
/data
├── valpoint.db      # SQLite 数据库文件
└── images/          # 本地存储的点位图片资源
```

在 `docker-compose.yml` 中，我们将容器内的 `/data` 目录挂载到了宿主机的 `./data` 目录（根据实际配置调整）。

## 🛠️ 开发与构建

如果您希望进行二次开发：

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发环境**
   ```bash
   # 同时启动前端 (Vite) 和后端 (Express)
   npm run dev
   # 或者分别启动
   npm run server   # 后端跑在 3209
   npm run client   # 前端跑在 3210
   ```

3. **构建生产镜像**
   ```bash
   docker build -t valpoint_s .
   ```

## 📝 版本历史

本项目已从早期的 Serverless (Vercel/Supabase) 架构全面迁移至 Docker + Local Storage 架构。
旧版云服务代码已被移除，请参考 `changelog.ts` 查看详细变更记录。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进本项目。

## 📄 许可证

MIT License
