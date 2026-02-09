#!/bin/bash
# ValPoint Docker 发布脚本 (Linux/macOS)
# 用途：自动化构建 Docker 镜像并推送到 Docker Hub
# 依赖：Docker 已启动，且用户已登录 (docker login)

set -e # 遇到错误立即退出

# 配置
DEFAULT_NAMESPACE="xiongaox7806"
IMAGE_NAME="valpoint_s"

# 从 Docker Hub 获取最新版本号
get_latest_dockerhub_version() {
    local namespace=$1
    local image=$2
    local api_url="https://hub.docker.com/v2/repositories/${namespace}/${image}/tags/?page_size=100"
    
    # 获取所有 tags，过滤出 x.y.z 格式的版本号，排序后取最新
    local latest=$(curl -s "$api_url" 2>/dev/null | \
        grep -oE '"name":"[0-9]+\.[0-9]+\.[0-9]+"' | \
        sed 's/"name":"//g' | sed 's/"//g' | \
        sort -t. -k1,1n -k2,2n -k3,3n | \
        tail -n 1)
    
    if [ -z "$latest" ]; then
        echo "0.0.0"
    else
        echo "$latest"
    fi
}

# 递增补丁版本号 (x.y.z -> x.y.z+1)
increment_patch() {
    local version=$1
    local major=$(echo "$version" | cut -d. -f1)
    local minor=$(echo "$version" | cut -d. -f2)
    local patch=$(echo "$version" | cut -d. -f3)
    echo "$major.$minor.$((patch + 1))"
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

# 1. 获取 Docker Hub 用户名
read -p "请输入 Docker Hub 用户名 (默认: $DEFAULT_NAMESPACE): " NAMESPACE
NAMESPACE=${NAMESPACE:-$DEFAULT_NAMESPACE}

FULL_IMAGE_NAME="$NAMESPACE/$IMAGE_NAME"

# 2. 从 Docker Hub 获取最新版本
echo -e "\n[1/5] 正在查询 Docker Hub 最新版本..."
LATEST_VERSION=$(get_latest_dockerhub_version "$NAMESPACE" "$IMAGE_NAME")
NEXT_VERSION=$(increment_patch "$LATEST_VERSION")

echo -e "Docker Hub 当前最新版本: \033[33m$LATEST_VERSION\033[0m"
echo -e "建议的下一个版本: \033[32m$NEXT_VERSION\033[0m"

read -p "请输入要发布的版本号 (默认: $NEXT_VERSION): " INPUT_VERSION
VERSION=${INPUT_VERSION:-$NEXT_VERSION}

echo -e "\n将使用版本: \033[32m$VERSION\033[0m"

echo -e "\n目标镜像: $FULL_IMAGE_NAME"
echo "Tag 1: $VERSION"
echo "Tag 2: latest"

read -p "确认构建并推送？ (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo -e "\033[33m已取消\033[0m"
    exit 0
fi

# 3. 构建镜像
echo -e "\n[2/5] 正在构建镜像 (这可能需要几分钟)..."
docker build -t $IMAGE_NAME .

# 4. 打标签
echo -e "\n[3/5] 正在打标签..."
docker tag "$IMAGE_NAME:latest" "$FULL_IMAGE_NAME:$VERSION"
docker tag "$IMAGE_NAME:latest" "$FULL_IMAGE_NAME:latest"
echo -e "\033[32mTags created.\033[0m"

# 5. 推送
echo -e "\n[4/5] 正在推送到 Docker Hub..."
echo "Pushing $VERSION..."
docker push "$FULL_IMAGE_NAME:$VERSION"

echo "Pushing latest..."
docker push "$FULL_IMAGE_NAME:latest"

echo -e "\n\033[32m[SUCCESS] 发布完成！\033[0m"
echo "镜像地址:"
echo "  $FULL_IMAGE_NAME:$VERSION"
echo "  $FULL_IMAGE_NAME:latest"
