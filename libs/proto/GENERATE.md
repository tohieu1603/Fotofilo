# 🚀 Proto Generation Commands

## 📋 Prerequisites

1. **Install Protocol Buffers Compiler (protoc)**
   ```bash
   # Windows (using winget)
   winget install Google.Protobuf
   
   # Windows (using chocolatey)
   choco install protobuf
   
   # Manual download
   # https://github.com/protocolbuffers/protobuf/releases
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

## 🔧 Generate Commands

### 1. **Generate TypeScript Types (Recommended)**
```bash
npm run proto:generate
```

### 2. **Generate JavaScript Files**
```bash
npm run proto:generate:js
```

### 3. **Generate gRPC Files**
```bash
npm run proto:generate:grpc
```

### 4. **Generate All Types**
```bash
npm run proto:generate:all
```

### 5. **Clean and Regenerate**
```bash
npm run proto:clean
npm run proto:generate
```

### 6. **Watch Mode (Auto-regenerate on changes)**
```bash
npm run proto:watch
```

### 7. **Setup Everything**
```bash
npm run proto:setup
```

## 🎯 Quick Start

```bash
# 1. Navigate to proto library
cd libs/proto

# 2. Install dependencies
npm install

# 3. Generate types
npm run proto:generate

# 4. Build library
npm run build
```

## 📁 Generated Files

After generation, you'll find:
- `src/generated/` - All generated TypeScript/JavaScript files
- `src/generated/common/` - Common message types
- `src/generated/product/` - Product service types
- `src/generated/cart/` - Cart service types (when available)
- `src/generated/order/` - Order service types (when available)

## 🚨 Troubleshooting

### Protoc not found
```bash
# Check if protoc is installed
protoc --version

# If not found, install it first
winget install Google.Protobuf
```

### Plugin not found
```bash
# Reinstall dependencies
npm install

# Check if plugins exist
ls node_modules/.bin/protoc-gen-*
```

### Permission denied
```bash
# Run PowerShell as Administrator
# Or use
npm run proto:clean
npm run proto:generate
```

## 📚 Usage in Services

```typescript
// Import generated types
import { 
  ProductService, 
  Product, 
  CreateProductRequest,
  CommonResponse 
} from '@nestcm/proto';

// Use in your service
const product: Product = {
  id: '1',
  name: 'Sample Product',
  // ... other fields
};
```
