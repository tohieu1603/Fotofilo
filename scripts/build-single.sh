#!/bin/bash

# Script to build a single Docker image
# Usage: ./scripts/build-single.sh [SERVICE_NAME] [DOCKERHUB_USERNAME] [VERSION]

set -e

SERVICE=$1
DOCKERHUB_USERNAME=${2:-"yourusername"}
VERSION=${3:-"latest"}

if [ -z "$SERVICE" ]; then
  echo "Error: Service name is required"
  echo "Usage: ./scripts/build-single.sh [SERVICE_NAME] [DOCKERHUB_USERNAME] [VERSION]"
  echo ""
  echo "Available services:"
  echo "  - api-gateway"
  echo "  - auth-service"
  echo "  - product-service"
  echo "  - cart-service"
  echo "  - order-service"
  echo "  - payment-service"
  echo "  - inventories-service"
  echo "  - notification-service"
  echo "  - elastic-elastic-service"
  exit 1
fi

echo "======================================"
echo "Building Docker Image"
echo "Service: $SERVICE"
echo "DockerHub Username: $DOCKERHUB_USERNAME"
echo "Version: $VERSION"
echo "======================================"

docker build \
  -t $DOCKERHUB_USERNAME/fotofilo-$SERVICE:$VERSION \
  -t $DOCKERHUB_USERNAME/fotofilo-$SERVICE:latest \
  -f apps/$SERVICE/Dockerfile \
  .

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Successfully built $SERVICE"
  echo ""
  echo "To push to DockerHub, run:"
  echo "  docker push $DOCKERHUB_USERNAME/fotofilo-$SERVICE:$VERSION"
  echo "  docker push $DOCKERHUB_USERNAME/fotofilo-$SERVICE:latest"
else
  echo "✗ Failed to build $SERVICE"
  exit 1
fi
