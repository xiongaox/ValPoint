#!/bin/bash

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if buildx builder exists, if not create one
if ! docker buildx inspect valpoint-builder > /dev/null 2>&1; then
    echo "Creating new buildx builder..."
    docker buildx create --name valpoint-builder --driver docker-container --bootstrap --use
else
    echo "Using existing buildx builder..."
    docker buildx use valpoint-builder
fi

# Handle version argument
VERSION=$1
TAGS="-t xiongaox7806/valpoint-a:latest"

if [ ! -z "$VERSION" ]; then
    echo "Version provided: $VERSION"
    TAGS="$TAGS -t xiongaox7806/valpoint-a:$VERSION"
fi

# Build and push for both platforms
echo "Building and pushing xiongaox7806/valpoint-a with tags: $TAGS"
docker buildx build --platform linux/amd64,linux/arm64 \
  $TAGS \
  --push .

echo "Done! Multi-arch image pushed."
