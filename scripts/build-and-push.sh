#!/bin/bash

# Script to build and push Docker images
# Usage: ./scripts/build-and-push.sh [DOCKERHUB_USERNAME] [VERSION]

set -e

DOCKERHUB_USERNAME=${1:-"yourusername"}
VERSION=${2:-"latest"}

echo "======================================"
echo "Building and Pushing Docker Images"
echo "DockerHub Username: $DOCKERHUB_USERNAME"
echo "Version: $VERSION"
echo "======================================"

# Build all images
./scripts/build-images.sh $DOCKERHUB_USERNAME $VERSION

# Push all images
./scripts/push-images.sh $DOCKERHUB_USERNAME $VERSION

echo ""
echo "======================================"
echo "✓ Build and push completed!"
echo "======================================"
