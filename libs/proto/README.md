# Proto Library

Thư viện chứa các proto files và export các hàm gRPC cho NestCM microservices.

## 🎯 Mục đích

- **Shared Proto Files**: Định nghĩa interfaces chung cho gRPC communication
- **Type Generation**: Export TypeScript types từ proto files
- **Service Definitions**: Định nghĩa các gRPC services
- **Message Types**: Định nghĩa các message structures

## 🏗️ Cấu trúc

```
libs/proto/
├── src/
│   ├── proto/                    # Proto files
│   │   ├── product.proto        # Product service proto
│   │   ├── cart.proto           # Cart service proto
│   │   ├── inventory.proto      # Inventory service proto
│   │   ├── order.proto          # Order service proto
│   │   ├── notification.proto   # Notification service proto
│   │   └── common.proto         # Common message types
│   ├── generated/                # Generated TypeScript files
│   ├── index.ts                  # Main exports
│   └── README.md                 # This file
├── package.json
└── tsconfig.json
```

## 🚀 Cài đặt Dependencies

### 1. Cài đặt gRPC packages

```bash
npm install @grpc/grpc-js @grpc/proto-loader
npm install --save-dev @types/google-protobuf
```

### 2. Cài đặt NestJS gRPC packages

```bash
npm install @nestjs/microservices
```

## 📝 Proto Files

### 1. Common Proto (common.proto)

```protobuf
// libs/proto/src/proto/common.proto
syntax = "proto3";

package common;

option go_package = "github.com/nestcm/proto/common";

// Common response message
message CommonResponse {
  bool success = 1;
  string message = 2;
  string error_code = 3;
  map<string, string> metadata = 4;
}

// Pagination message
message PaginationRequest {
  int32 page = 1;
  int32 limit = 2;
  string sort_by = 3;
  string sort_order = 4;
}

message PaginationResponse {
  int32 page = 1;
  int32 limit = 2;
  int32 total = 3;
  int32 total_pages = 4;
}

// Error message
message Error {
  string code = 1;
  string message = 2;
  string details = 3;
}

// Timestamp message
message Timestamp {
  int64 seconds = 1;
  int32 nanos = 2;
}

// Money message
message Money {
  string currency = 1;
  int64 amount = 2; // Amount in smallest currency unit (e.g., cents)
}
```

### 2. Product Proto (product.proto)

```protobuf
// libs/proto/src/proto/product.proto
syntax = "proto3";

package product;

import "common.proto";

option go_package = "github.com/nestcm/proto/product";

// Product service definition
service ProductService {
  rpc CreateProduct(CreateProductRequest) returns (ProductResponse);
  rpc GetProduct(GetProductRequest) returns (ProductResponse);
  rpc ListProducts(ListProductsRequest) returns (ListProductsResponse);
  rpc UpdateProduct(UpdateProductRequest) returns (ProductResponse);
  rpc DeleteProduct(DeleteProductRequest) returns (common.CommonResponse);
  rpc SearchProducts(SearchProductsRequest) returns (ListProductsResponse);
  rpc GetProductStats(GetProductStatsRequest) returns (ProductStatsResponse);
  rpc UpdateStock(UpdateStockRequest) returns (ProductResponse);
  rpc BulkUpdateProducts(BulkUpdateProductsRequest) returns (BulkUpdateProductsResponse);
}

// Product message
message Product {
  string id = 1;
  string name = 2;
  string description = 3;
  common.Money price = 4;
  string category = 5;
  string brand = 6;
  string sku = 7;
  int32 stock_quantity = 8;
  string status = 9;
  map<string, string> attributes = 10;
  repeated string tags = 11;
  string image_url = 12;
  common.Timestamp created_at = 13;
  common.Timestamp updated_at = 14;
  bool is_featured = 15;
  double rating = 16;
  int32 review_count = 17;
}

// Create product request
message CreateProductRequest {
  string name = 1;
  string description = 2;
  common.Money price = 3;
  string category = 4;
  string brand = 5;
  string sku = 6;
  int32 stock_quantity = 7;
  string status = 8;
  map<string, string> attributes = 9;
  repeated string tags = 10;
  string image_url = 11;
  bool is_featured = 12;
}

// Get product request
message GetProductRequest {
  string id = 1;
}

// Product response
message ProductResponse {
  Product product = 1;
  common.Error error = 2;
}

// List products request
message ListProductsRequest {
  common.PaginationRequest pagination = 1;
  string category = 2;
  string brand = 3;
  common.Money min_price = 4;
  common.Money max_price = 5;
  string status = 6;
  string search = 7;
}

// List products response
message ListProductsResponse {
  repeated Product products = 1;
  common.PaginationResponse pagination = 2;
  common.Error error = 3;
}

// Update product request
message UpdateProductRequest {
  string id = 1;
  Product update_data = 2;
}

// Delete product request
message DeleteProductRequest {
  string id = 1;
}

// Search products request
message SearchProductsRequest {
  string query = 1;
  common.PaginationRequest pagination = 2;
}

// Get product stats request
message GetProductStatsRequest {
  string category = 1;
  common.Timestamp from_date = 2;
  common.Timestamp to_date = 3;
}

// Product stats response
message ProductStatsResponse {
  repeated ProductStat stats = 1;
  common.Error error = 2;
}

// Product stat
message ProductStat {
  string category = 1;
  int32 count = 2;
  common.Money avg_price = 3;
  common.Money min_price = 4;
  common.Money max_price = 5;
  int32 total_stock = 6;
}

// Update stock request
message UpdateStockRequest {
  string product_id = 1;
  int32 quantity = 2;
}

// Bulk update products request
message BulkUpdateProductsRequest {
  repeated string product_ids = 1;
  Product update_data = 2;
}

// Bulk update products response
message BulkUpdateProductsResponse {
  repeated Product products = 1;
  common.Error error = 2;
}
```

### 3. Cart Proto (cart.proto)

```protobuf
// libs/proto/src/proto/cart.proto
syntax = "proto3";

package cart;

import "common.proto";
import "product.proto";

option go_package = "github.com/nestcm/proto/cart";

// Cart service definition
service CartService {
  rpc GetCart(GetCartRequest) returns (CartResponse);
  rpc AddItem(AddItemRequest) returns (CartResponse);
  rpc UpdateItem(UpdateItemRequest) returns (CartResponse);
  rpc RemoveItem(RemoveItemRequest) returns (CartResponse);
  rpc ClearCart(ClearCartRequest) returns (common.CommonResponse);
  rpc GetCartSummary(GetCartSummaryRequest) returns (CartSummaryResponse);
}

// Cart message
message Cart {
  string id = 1;
  string user_id = 2;
  repeated CartItem items = 3;
  common.Timestamp created_at = 4;
  common.Timestamp updated_at = 5;
  string status = 6; // active, abandoned, converted
}

// Cart item message
message CartItem {
  string id = 1;
  string product_id = 2;
  product.Product product = 3;
  int32 quantity = 4;
  common.Money unit_price = 5;
  common.Money total_price = 6;
  common.Timestamp added_at = 7;
}

// Get cart request
message GetCartRequest {
  string user_id = 1;
}

// Cart response
message CartResponse {
  Cart cart = 1;
  common.Error error = 2;
}

// Add item request
message AddItemRequest {
  string user_id = 1;
  string product_id = 2;
  int32 quantity = 3;
}

// Update item request
message UpdateItemRequest {
  string user_id = 1;
  string item_id = 2;
  int32 quantity = 3;
}

// Remove item request
message RemoveItemRequest {
  string user_id = 1;
  string item_id = 2;
}

// Clear cart request
message ClearCartRequest {
  string user_id = 1;
}

// Get cart summary request
message GetCartSummaryRequest {
  string user_id = 1;
}

// Cart summary response
message CartSummaryResponse {
  int32 total_items = 1;
  common.Money total_amount = 2;
  common.Error error = 3;
}
```

### 4. Order Proto (order.proto)

```protobuf
// libs/proto/src/proto/order.proto
syntax = "proto3";

package order;

import "common.proto";
import "product.proto";

option go_package = "github.com/nestcm/proto/order";

// Order service definition
service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);
  rpc GetOrder(GetOrderRequest) returns (OrderResponse);
  rpc ListOrders(ListOrdersRequest) returns (ListOrdersResponse);
  rpc UpdateOrderStatus(UpdateOrderStatusRequest) returns (OrderResponse);
  rpc CancelOrder(CancelOrderRequest) returns (common.CommonResponse);
  rpc GetOrderHistory(GetOrderHistoryRequest) returns (ListOrdersResponse);
}

// Order message
message Order {
  string id = 1;
  string user_id = 2;
  repeated OrderItem items = 3;
  common.Money subtotal = 4;
  common.Money tax = 5;
  common.Money shipping = 6;
  common.Money total = 7;
  string status = 8; // pending, confirmed, shipped, delivered, cancelled
  string payment_status = 9; // pending, paid, failed, refunded
  common.Timestamp created_at = 10;
  common.Timestamp updated_at = 11;
  Address shipping_address = 12;
  Address billing_address = 13;
}

// Order item message
message OrderItem {
  string id = 1;
  string product_id = 2;
  product.Product product = 3;
  int32 quantity = 4;
  common.Money unit_price = 5;
  common.Money total_price = 6;
}

// Address message
message Address {
  string street = 1;
  string city = 2;
  string state = 3;
  string country = 4;
  string postal_code = 5;
}

// Create order request
message CreateOrderRequest {
  string user_id = 1;
  repeated OrderItemRequest items = 2;
  Address shipping_address = 3;
  Address billing_address = 4;
}

// Order item request
message OrderItemRequest {
  string product_id = 1;
  int32 quantity = 2;
}

// Get order request
message GetOrderRequest {
  string order_id = 1;
}

// Order response
message OrderResponse {
  Order order = 1;
  common.Error error = 2;
}

// List orders request
message ListOrdersRequest {
  string user_id = 1;
  common.PaginationRequest pagination = 2;
  string status = 3;
}

// List orders response
message ListOrdersResponse {
  repeated Order orders = 1;
  common.PaginationResponse pagination = 2;
  common.Error error = 3;
}

// Update order status request
message UpdateOrderStatusRequest {
  string order_id = 1;
  string status = 2;
}

// Cancel order request
message CancelOrderRequest {
  string order_id = 1;
  string reason = 2;
}

// Get order history request
message GetOrderHistoryRequest {
  string user_id = 1;
  common.PaginationRequest pagination = 2;
}
```

## 🔧 Cấu hình gRPC

### 1. Cập nhật app.module.ts

```typescript
// apps/product-service/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'product',
          protoPath: join(__dirname, '../../../libs/proto/src/proto/product.proto'),
        },
      },
    ]),
    // ... other imports
  ],
  // ... rest of module config
})
export class AppModule {}
```

### 2. Sử dụng gRPC Client

```typescript
// apps/product-service/src/product/product.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

@Injectable()
export class ProductService implements OnModuleInit {
  private productService: any;

  constructor(private client: ClientGrpc) {}

  onModuleInit() {
    this.productService = this.client.getService<any>('ProductService');
  }

  async createProduct(data: any) {
    return new Promise((resolve, reject) => {
      this.productService.createProduct(data, (err: any, response: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
}
```

## 📦 Package.json Scripts

```json
{
  "scripts": {
    "proto:generate": "protoc --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./src/generated --ts_proto_opt=esModuleInterop=true --proto_path=./src/proto ./src/proto/*.proto",
    "proto:watch": "nodemon --exec 'npm run proto:generate' --watch src/proto"
  }
}
```

## 🚀 Sử dụng

### 1. Generate TypeScript types

```bash
npm run proto:generate
```

### 2. Import và sử dụng

```typescript
import { ProductService, Product, CreateProductRequest } from '@nestcm/proto';

// Sử dụng các types đã generate
const product: Product = {
  id: '1',
  name: 'Sample Product',
  // ... other fields
};
```

## 📚 Tài liệu tham khảo

- [gRPC Documentation](https://grpc.io/docs/)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)
- [NestJS Microservices](https://docs.nestjs.com/microservices/grpc)
- [TypeScript gRPC](https://github.com/grpc/grpc-node)
