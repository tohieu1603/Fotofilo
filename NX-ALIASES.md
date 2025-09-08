# NestCM NX Aliases - Hướng dẫn sử dụng

## 🎯 Tổng quan

File `nx.json` đã được tối ưu hóa với các alias và cấu hình tiện lợi để phát triển nhanh hơn.

## 🚀 Các Alias chính

### **1. Library Aliases**
```bash
# Truy cập nhanh vào các libraries
nx run proto:build          # Build proto library
nx run common:build         # Build common library
nx run database:build       # Build database library
nx run auth:build           # Build auth library
```

### **2. Service Aliases**
```bash
# Truy cập nhanh vào các services
nx run api-gateway:serve    # Chạy API Gateway
nx run product-service:serve # Chạy Product Service
nx run cart-service:serve   # Chạy Cart Service
nx run inventories-service:serve # Chạy Inventory Service
nx run notification-service:serve # Chạy Notification Service
nx run order-service:serve  # Chạy Order Service
```

### **3. Proto Generation Aliases**
```bash
# Generate proto files
nx run proto:proto:generate     # Generate TypeScript từ proto
nx run proto:proto:generate:all # Generate tất cả (TS + JS + gRPC)
nx run proto:proto:clean        # Clean generated files
nx run proto:proto:watch        # Watch proto files và auto-generate
```

## 🔧 Cách sử dụng Alias

### **Sử dụng trực tiếp:**
```bash
# Thay vì gõ đường dẫn dài
nx run libs/proto:proto:generate

# Có thể dùng alias ngắn gọn
nx run proto:proto:generate
```

### **Sử dụng trong package.json scripts:**
```json
{
  "scripts": {
    "proto:generate": "nx run proto:proto:generate",
    "proto:generate:all": "nx run proto:proto:generate:all",
    "proto:clean": "nx run proto:proto:clean",
    "proto:watch": "nx run proto:proto:watch",
    "start:api": "nx run api-gateway:serve",
    "start:product": "nx run product-service:serve",
    "start:cart": "nx run cart-service:serve",
    "start:inventory": "nx run inventories-service:serve",
    "start:notification": "nx run notification-service:serve",
    "start:order": "nx run order-service:serve"
  }
}
```

## 📊 Cấu hình Cache

### **Cacheable Operations:**
- ✅ `build` - Build operations
- ✅ `lint` - Linting operations  
- ✅ `test` - Testing operations
- ✅ `e2e` - End-to-end testing
- ✅ `proto:generate` - Proto generation
- ✅ `proto:generate:all` - All proto operations

### **Cache Configuration:**
```json
"tasksRunnerOptions": {
  "default": {
    "runner": "nx/tasks-runners/default",
    "options": {
      "cacheableOperations": [
        "build", "lint", "test", "e2e", 
        "proto:generate", "proto:generate:all"
      ],
      "parallel": 3,
      "cacheDirectory": ".nx-cache"
    }
  }
}
```

## 🎯 Target Defaults

### **Build Dependencies:**
```json
"targetDefaults": {
  "build": {
    "dependsOn": ["^build"],        // Build dependencies first
    "inputs": ["production", "^production"],
    "cache": true
  },
  "serve": {
    "dependsOn": ["^build"],        // Build before serve
    "cache": false
  }
}
```

### **Proto Generation:**
```json
"proto:generate": {
  "inputs": ["default"],
  "cache": true,
  "outputs": ["{projectRoot}/src/generated"]
},
"proto:generate:all": {
  "dependsOn": ["proto:generate"],  // Generate TS before JS/gRPC
  "inputs": ["default"],
  "cache": true,
  "outputs": ["{projectRoot}/src/generated"]
}
```

## 🚀 Quick Commands

### **Development:**
```bash
# Start tất cả services
npm run start:all

# Start từng service
npm run start:api
npm run start:product
npm run start:cart
npm run start:inventory
npm run start:notification
npm run start:order
```

### **Proto Generation:**
```bash
# Generate proto files
npm run proto:generate
npm run proto:generate:all
npm run proto:clean
npm run proto:watch
```

### **Build & Test:**
```bash
# Build tất cả
nx run-many --target=build --all

# Test tất cả
nx run-many --target=test --all

# Lint tất cả
nx run-many --target=lint --all
```

## 🔍 Generator Defaults

### **NestJS Generators:**
```json
"generators": {
  "@nx/nest:application": {
    "unitTestRunner": "jest",
    "e2eTestRunner": "jest",
    "linter": "eslint",
    "style": "css"
  },
  "@nx/nest:library": {
    "unitTestRunner": "jest",
    "linter": "eslint",
    "style": "css"
  }
}
```

### **Sử dụng Generators:**
```bash
# Tạo service mới
nx generate @nx/nest:service --name=user --project=product-service

# Tạo controller mới
nx generate @nx/nest:controller --name=product --project=product-service

# Tạo library mới
nx generate @nx/nest:library --name=shared --directory=libs/shared
```

## 📁 Workspace Layout

### **Cấu trúc thư mục:**
```json
"workspaceLayout": {
  "appsDir": "apps",        // Applications
  "libsDir": "libs"         // Libraries
}
```

### **CLI Configuration:**
```json
"cli": {
  "defaultCollection": "@nx/nest",  // Default generator collection
  "packageManager": "npm"           // Package manager
}
```

## 🎯 Best Practices

### **1. Sử dụng Alias:**
```bash
# ✅ Good - Sử dụng alias
nx run proto:proto:generate

# ❌ Bad - Gõ đường dẫn dài
nx run libs/proto:proto:generate
```

### **2. Cache Optimization:**
```bash
# Clean cache khi cần
nx reset

# View cache status
nx show projects
```

### **3. Parallel Execution:**
```bash
# Chạy nhiều tasks song song
nx run-many --target=build --all --parallel=3

# Chạy specific services
nx run-many --target=serve --projects=api-gateway,product-service
```

## 🔧 Troubleshooting

### **Cache Issues:**
```bash
# Reset cache
nx reset

# Clear specific cache
rm -rf .nx-cache
```

### **Dependency Issues:**
```bash
# Check dependencies
nx graph

# Show project info
nx show project product-service
```

### **Build Issues:**
```bash
# Clean build
nx run-many --target=build --all --skip-nx-cache

# Build specific project
nx build product-service --skip-nx-cache
```

## 📚 References

- [NX Documentation](https://nx.dev/)
- [NestJS with NX](https://nx.dev/recipes/nestjs)
- [NX Cache](https://nx.dev/concepts/how-caching-works)
- [NX Generators](https://nx.dev/concepts/more-concepts/why-generators)

## 🤝 Contributing

1. Sử dụng alias thay vì đường dẫn dài
2. Tận dụng cache để tăng tốc độ
3. Sử dụng parallel execution khi có thể
4. Cập nhật alias khi thêm project mới
