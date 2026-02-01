#!/bin/bash
# ValPoint Docker 发布脚本 (Linux/macOS)
# 用途：自动化构建 Docker 镜像并推送到 Docker Hub
# 依赖：Docker 已启动，且用户已登录 (docker login)

set -e # 遇到错误立即退出

# 获取项目版本号 (简单提取，避免依赖 jq)
get_package_version() {
    if [ ! -f "package.json" ]; then
        echo "错误: 找不到 package.json"
        exit 1
    fi
    grep '"version":' package.json | head -n 1 | sed 's/[",]//g' | awk '{print $2}'
}

echo -e "\033[36m============================\033[0m"
echo -e "\033[36m   ValPoint Docker Publish  \033[0m"
echo -e "\033[36m============================\033[0m"

# 0. 检查 Docker 状态
echo -e "\n[0/5] 检查 Docker 环境..."
if ! docker info > /dev/null 2>&1; then
    echo -e "\033[31m错误: Docker 未运行或未安装\033[0m"
    exit 1
fi
echo -e "\033[32mDocker 运行正常\033[0m"

# 1. 获取输入
VERSION=$(get_package_version)
echo -e "\n当前项目版本: \033[33m$VERSION\033[0m"

read -p "请输入 Docker Hub 用户名 (默认: xiongaox): " NAMESPACE
NAMESPACE=${NAMESPACE:-xiongaox}

IMAGE_NAME="valpoint_s"
FULL_IMAGE_NAME="$NAMESPACE/$IMAGE_NAME"

echo -e "\n目标镜像: $FULL_IMAGE_NAME"
echo "Tag 1: $VERSION"
echo "Tag 2: latest"

read -p "确认构建并推送？ (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo -e "\033[33m已取消\033[0m"
    exit 0
fi

# 2. 构建镜像
echo -e "\n[1/5] 正在构建镜像 (这可能需要几分钟)..."
docker build -t $IMAGE_NAME .

# 3. 打标签
echo -e "\n[2/5] 正在打标签..."
docker tag "$IMAGE_NAME:latest" "$FULL_IMAGE_NAME:$VERSION"
docker tag "$IMAGE_NAME:latest" "$FULL_IMAGE_NAME:latest"
echo -e "\033[32mTags created.\033[0m"

# 4. 推送
echo -e "\n[3/5] 正在推送到 Docker Hub..."
echo "Pushing $VERSION..."
docker push "$FULL_IMAGE_NAME:$VERSION"

echo "Pushing latest..."
docker push "$FULL_IMAGE_NAME:latest"

echo -e "\n\033[32m[SUCCESS] 发布完成！\033[0m"
echo "镜像地址:"
echo "  $FULL_IMAGE_NAME:$VERSION"
echo "  $FULL_IMAGE_NAME:latest"
