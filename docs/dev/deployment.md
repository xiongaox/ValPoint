# 部署指南

ValPoint 可以部署到多个平台，推荐使用 Vercel 或 Cloudflare Pages。

## Vercel 部署（推荐）

### 优势
- ✅ 自动构建和部署
- ✅ 全球 CDN 加速
- ✅ 免费 SSL 证书
- ✅ 自动预览部署
- ✅ 环境变量管理

### 部署步骤

#### 1. Fork 项目

将项目 Fork 到你的 GitHub 账号。

#### 2. 导入到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **"New Project"**
3. 选择你的 GitHub 仓库
4. 点击 **"Import"**

#### 3. 配置项目

Vercel 会自动检测 Vite 项目，无需手动配置构建命令。

默认配置：
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 4. 添加环境变量

在 Vercel 项目设置中添加环境变量：

```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
VITE_SUPABASE_SHARE_URL=https://[SHARE_PROJECT_ID].supabase.co
VITE_SUPABASE_SHARE_ANON_KEY=[YOUR_SHARE_ANON_KEY]
```

#### 5. 部署

点击 **"Deploy"** 按钮，等待构建完成。

#### 6. 配置自定义域名（可选）

1. 在 Vercel 项目设置中点击 **"Domains"**
2. 添加你的域名
3. 按照提示配置 DNS 记录

### 自动部署

配置完成后，每次推送到 GitHub 都会自动触发部署：
- `main` 分支 → 生产环境
- 其他分支 → 预览环境

## Cloudflare Pages 部署

### 优势
- ✅ 全球 CDN 网络
- ✅ 无限带宽
- ✅ 免费 SSL 证书
- ✅ 快速构建

### 部署步骤

#### 1. 连接 GitHub

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
2. 点击 **"Create a project"**
3. 连接你的 GitHub 账号
4. 选择 ValPoint 仓库

#### 2. 配置构建设置

```
Build command: npm run build
Build output directory: dist
Root directory: /
```

#### 3. 添加环境变量

在项目设置中添加环境变量（同 Vercel）。

#### 4. 部署

点击 **"Save and Deploy"**，等待构建完成。

## 自托管部署

### 使用 Nginx

#### 1. 构建项目

```bash
npm run build
```

#### 2. 配置 Nginx

```nginx
server {
    listen 80;
    server_name valpoint.example.com;
    
    root /var/www/valpoint/dist;
    index index.html;
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 3. 部署文件

```bash
# 上传构建产物
scp -r dist/* user@server:/var/www/valpoint/dist/

# 重启 Nginx
ssh user@server "sudo systemctl restart nginx"
```

<!--
### 使用 Docker

#### 1. 创建 Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 创建 nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```


#### 3. 构建和运行

```bash
# 构建镜像
docker build -t valpoint .

# 运行容器
docker run -d -p 80:80 \
  -e VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co \
  -e VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY] \
  valpoint
```
-->

## 环境变量管理

### 开发环境

使用 `.env` 文件：

```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

### 生产环境

在部署平台的环境变量设置中配置：

| 平台 | 配置位置 |
|------|----------|
| Vercel | Settings → Environment Variables |
| Cloudflare Pages | Settings → Environment variables |
| 自托管 | `.env.production` 或系统环境变量 |

::: warning 安全提示
- 不要将 `.env` 文件提交到 Git
- 使用不同的密钥用于开发和生产环境
- 定期更换密钥
:::

## 性能优化

### 构建优化

#### 1. 代码分割

Vite 自动进行代码分割，无需额外配置。

#### 2. 压缩

生产构建自动启用压缩：
- JavaScript 压缩（Terser）
- CSS 压缩（cssnano）

#### 3. Tree Shaking

自动移除未使用的代码。

### CDN 配置

#### 使用 Vercel CDN

Vercel 自动提供全球 CDN，无需配置。

#### 使用 Cloudflare CDN

Cloudflare Pages 自动使用 Cloudflare CDN。

#### 自定义 CDN

如果自托管，可以配置 CDN：

```nginx
# 设置缓存头
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options "nosniff";
}
```

## 监控和日志

### Vercel Analytics

启用 Vercel Analytics：
1. 在项目设置中启用 Analytics
2. 查看访问统计和性能指标

### 自定义监控

可以集成第三方监控服务：
- Google Analytics
- Sentry（错误监控）
- LogRocket（用户行为）

## 持续集成/持续部署（CI/CD）

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 常见问题

### Q: 部署后页面空白？

检查：
1. 环境变量是否配置正确
2. 构建是否成功
3. 浏览器控制台是否有错误

### Q: 路由 404 错误？

需要配置 SPA 路由重写：
- Vercel：自动配置
- Cloudflare Pages：自动配置
- Nginx：添加 `try_files` 配置

### Q: 环境变量不生效？

确保：
1. 变量名以 `VITE_` 开头
2. 重新构建项目
3. 清除浏览器缓存

### Q: 构建失败？

检查：
1. Node.js 版本（需要 >= 18）
2. 依赖是否安装完整
3. 构建日志中的错误信息

### Q: 如何回滚部署？

- Vercel：在 Deployments 页面选择之前的部署，点击 "Promote to Production"
- Cloudflare Pages：在 Deployments 页面选择之前的部署，点击 "Rollback"
- 自托管：恢复之前的构建产物
