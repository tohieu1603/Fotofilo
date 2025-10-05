# Docker Setup Guide - Fotofilo Monorepo

Hướng dẫn build và deploy Docker images cho monorepo NX microservices.

## Cấu trúc

### Services
- **api-gateway** (Port 3000) - API Gateway chính
- **auth-service** (Port 50052) - Service xác thực
- **product-service** (Port 50051) - Service quản lý sản phẩm
- **cart-service** (Port 50053) - Service giỏ hàng
- **order-service** (Port 50054) - Service đơn hàng
- **payment-service** (Port 50055) - Service thanh toán
- **inventories-service** (Port 50056) - Service kho hàng
- **notification-service** (Port 50057) - Service thông báo
- **elastic-service** (Port 50058) - Service Elasticsearch

### Shared Libraries
- `@nestcm/auth` - Authentication & Authorization
- `@nestcm/common` - Common utilities, decorators, filters
- `@nestcm/database` - Database configurations & entities
- `@nestcm/proto` - Protocol Buffers & gRPC definitions

## Dockerfile

Mỗi service có Dockerfile tối ưu với:
- **Multi-stage build** để giảm kích thước image
- **NX build optimization** tự động bundle shared libraries
- **Non-root user** cho security
- **Production dependencies only** trong runtime image

## Quick Start

### 1. Setup Environment

```bash
# Copy file .env.example và điều chỉnh theo môi trường của bạn
cp .env.example .env
```

### 2. Build All Services

```bash
# Trên Linux/Mac
chmod +x scripts/*.sh
./scripts/build-images.sh yourusername latest

# Trên Windows (Git Bash)
bash scripts/build-images.sh yourusername latest
```

### 3. Run với Docker Compose

```bash
# Start all services và infrastructure
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Push to DockerHub

```bash
# Login to DockerHub
docker login

# Push all images
./scripts/push-images.sh yourusername latest

# Hoặc build và push cùng lúc
./scripts/build-and-push.sh yourusername latest
```

## Build Single Service

```bash
# Build một service cụ thể
./scripts/build-single.sh auth-service yourusername latest

# Push service đó lên DockerHub
docker push yourusername/fotofilo-auth-service:latest
```

## Docker Commands

### Build Commands

```bash
# Build một service cụ thể
docker build -t yourusername/fotofilo-auth-service:latest -f apps/auth-service/Dockerfile .

# Build với caching
docker build --cache-from yourusername/fotofilo-auth-service:latest \
  -t yourusername/fotofilo-auth-service:latest \
  -f apps/auth-service/Dockerfile .
```

### Run Commands

```bash
# Run một service riêng lẻ
docker run -p 50052:50052 \
  -e DATABASE_HOST=localhost \
  -e REDIS_HOST=localhost \
  yourusername/fotofilo-auth-service:latest

# Run với docker-compose
docker-compose up auth-service

# Rebuild và start
docker-compose up --build auth-service
```

### Debug Commands

```bash
# View logs
docker logs fotofilo-auth-service

# Access shell
docker exec -it fotofilo-auth-service sh

# Inspect image
docker inspect yourusername/fotofilo-auth-service:latest

# Check image size
docker images | grep fotofilo
```

## Environment Variables

Mỗi service cần các biến môi trường sau:

### Common Variables (tất cả services)
```env
NODE_ENV=production
```

### Services với Database
```env
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=database_name
```

### Services với Redis
```env
REDIS_HOST=redis
REDIS_PORT=6379
```

### Services với Kafka
```env
KAFKA_BROKER=kafka:29092
```

### Auth Service
```env
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600
```

### Notification Service
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
SMTP_FROM=noreply@fotofilo.com
```

### Elasticsearch Service
```env
ELASTICSEARCH_NODE=http://elasticsearch:9200
```

### API Gateway
```env
PORT=3000
AUTH_SERVICE_URL=auth-service:50052
PRODUCT_SERVICE_URL=product-service:50051
CART_SERVICE_URL=cart-service:50053
ORDER_SERVICE_URL=order-service:50054
PAYMENT_SERVICE_URL=payment-service:50055
INVENTORIES_SERVICE_URL=inventories-service:50056
JWT_SECRET=your-secret-key
```

## Infrastructure Services

Docker Compose bao gồm các infrastructure services:

- **PostgreSQL** (5432) - Databases cho mỗi service
- **Redis** (6379) - Caching & Session
- **Kafka** (9092) - Message Queue
- **Zookeeper** (2181) - Kafka coordinator
- **Elasticsearch** (9200) - Search engine
- **Kafdrop** (9000) - Kafka UI

## Best Practices

### 1. Image Tagging
```bash
# Sử dụng semantic versioning
docker tag yourusername/fotofilo-auth-service:latest yourusername/fotofilo-auth-service:v1.0.0
docker push yourusername/fotofilo-auth-service:v1.0.0
```

### 2. Caching
```bash
# Tận dụng Docker layer caching
# Không thay đổi thứ tự COPY trong Dockerfile
# Build với --cache-from khi có thể
```

### 3. Security
- Không commit file `.env` với secrets thật
- Sử dụng Docker secrets hoặc environment variables
- Run containers với non-root user (đã implement)
- Scan images cho vulnerabilities:
```bash
docker scan yourusername/fotofilo-auth-service:latest
```

### 4. Optimization
- Multi-stage build đã được implement
- npm ci thay vì npm install
- npm cache clean sau install
- .dockerignore để exclude files không cần thiết

## Deployment

### Deploy to Kubernetes

```bash
# Tạo deployment files
kubectl create deployment auth-service \
  --image=yourusername/fotofilo-auth-service:latest

# Expose service
kubectl expose deployment auth-service \
  --type=LoadBalancer \
  --port=50052
```

### Deploy to Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml fotofilo

# List services
docker stack services fotofilo
```

### Deploy to Cloud

#### AWS ECS/ECR
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag for ECR
docker tag yourusername/fotofilo-auth-service:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/fotofilo-auth-service:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/fotofilo-auth-service:latest
```

#### Google Cloud GCR
```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Tag for GCR
docker tag yourusername/fotofilo-auth-service:latest gcr.io/project-id/fotofilo-auth-service:latest

# Push to GCR
docker push gcr.io/project-id/fotofilo-auth-service:latest
```

## Troubleshooting

### Build Errors

```bash
# Clear Docker cache
docker system prune -a

# Build without cache
docker build --no-cache -f apps/auth-service/Dockerfile .

# Check build logs
docker build -f apps/auth-service/Dockerfile . 2>&1 | tee build.log
```

### Runtime Errors

```bash
# Check service logs
docker logs fotofilo-auth-service

# Check service health
docker inspect fotofilo-auth-service | grep -A 10 Health

# Access container shell
docker exec -it fotofilo-auth-service sh
```

### Network Issues

```bash
# Inspect network
docker network inspect fotofilo_default

# Check service connectivity
docker exec -it fotofilo-auth-service ping auth-db
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        run: |
          ./scripts/build-and-push.sh ${{ secrets.DOCKERHUB_USERNAME }} ${{ github.sha }}
```

## Support

Để được hỗ trợ, mở issue trên GitHub repository.
