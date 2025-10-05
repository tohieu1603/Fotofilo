#!/bin/bash

# Script to push Docker images to DockerHub
# Usage: ./scripts/push-images.sh [DOCKERHUB_USERNAME]

set -e

DOCKERHUB_USERNAME=${1:-"yourusername"}
VERSION=${2:-"latest"}

echo "======================================"
echo "Pushing Docker Images to DockerHub"
echo "DockerHub Username: $DOCKERHUB_USERNAME"
echo "Version: $VERSION"
echo "======================================"

# Login to DockerHub
echo ""
echo "Logging in to DockerHub..."
docker login

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

# Push each service
for SERVICE in "${SERVICES[@]}"; do
  echo ""
  echo "Pushing $SERVICE..."

  docker push $DOCKERHUB_USERNAME/fotofilo-$SERVICE:$VERSION
  docker push $DOCKERHUB_USERNAME/fotofilo-$SERVICE:latest

  if [ $? -eq 0 ]; then
    echo "✓ Successfully pushed $SERVICE"
  else
    echo "✗ Failed to push $SERVICE"
    exit 1
  fi
done

echo ""
echo "======================================"
echo "All images pushed successfully!"
echo "======================================"
