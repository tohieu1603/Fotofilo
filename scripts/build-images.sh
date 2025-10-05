#!/bin/bash

# Script to build Docker images for all services
# Usage: ./scripts/build-images.sh [DOCKERHUB_USERNAME]

set -e

DOCKERHUB_USERNAME=${1:-"yourusername"}
VERSION=${2:-"latest"}

echo "======================================"
echo "Building Docker Images for Fotofilo"
echo "DockerHub Username: $DOCKERHUB_USERNAME"
echo "Version: $VERSION"
echo "======================================"

# Array of services
SERVICES=(
  "api-gateway"
  "auth-service"
  "product-service"
  "cart-service"
  "order-service"
  "payment-service"
  "inventories-service"
  "notification-service"
  "elastic-elastic-service"
)

# Build each service
for SERVICE in "${SERVICES[@]}"; do
  echo ""
  echo "Building $SERVICE..."
  docker build \
    -t $DOCKERHUB_USERNAME/fotofilo-$SERVICE:$VERSION \
    -t $DOCKERHUB_USERNAME/fotofilo-$SERVICE:latest \
    -f apps/$SERVICE/Dockerfile \
    .

  if [ $? -eq 0 ]; then
    echo "✓ Successfully built $SERVICE"
  else
    echo "✗ Failed to build $SERVICE"
    exit 1
  fi
done

echo ""
echo "======================================"
echo "All images built successfully!"
echo "======================================"
echo ""
echo "Built images:"
docker images | grep "fotofilo-"
