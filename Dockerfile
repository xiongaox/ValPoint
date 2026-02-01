# ============================================
# ValPoint Docker Build - 本地化版本
# ============================================

# Stage 1: 构建前端
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# Stage 2: 构建后端
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

# 复制后端依赖
COPY server/package*.json ./
RUN npm ci --only=production

# ============================================
# Stage 3: 生产运行时
# ============================================
FROM node:20-alpine

WORKDIR /app

# 安装必要的系统依赖（sharp 需要）
RUN apk add --no-cache vips-dev

# 复制后端代码和依赖
COPY server/ ./server/
COPY --from=backend-builder /app/server/node_modules ./server/node_modules

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 复制头像资源
COPY public/avatars ./public/avatars

# 创建数据目录
RUN mkdir -p /data/images

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3209
ENV DATA_DIR=/data

# 数据卷
VOLUME /data

# 暴露端口
EXPOSE 3209

# 启动服务
CMD ["node", "server/index.js"]
