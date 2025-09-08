# Database Library

Thư viện database chung cho NestCM microservices monorepo.

## 🎯 Mục đích

Mặc dù mỗi service có database riêng (Database per Service pattern), lib này cung cấp:

- **Shared Configuration**: Cấu hình kết nối chung
- **Connection Management**: Quản lý connection pool
- **Environment Variables**: Xử lý biến môi trường
 - **Common Utilities**: Helper functions cho database operations

## 🏗️ Cấu trúc

```
libs/database/
├── src/
│   ├── lib/
│   │   ├── database.module.ts      # Module chính
│   │   ├── database.service.ts     # Service chính
│   │   └── database.interface.ts   # Interfaces
│   └── index.ts                    # Exports
└── README.md
```

## 🚀 Cách sử dụng

### 1. Import vào service

```typescript
// app.module.ts
import { DatabaseModule } from '@nestcm/database';

@Module({
  imports: [DatabaseModule],
  // ...
})
export class AppModule {}
```

### 2. Sử dụng trong service

```typescript
// product.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@nestcm/database';

@Injectable()
export class ProductService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getDatabaseConfig() {
    // Lấy cấu hình database cho product-service
    const config = this.databaseService.getServiceDatabaseConfig('product-service');
    
    // Lấy connection string
    const connectionString = this.databaseService.getConnectionString('product-service');
    
    // Lấy pool configuration
    const poolConfig = this.databaseService.getPoolConfig('product-service');
    
    return { config, connectionString, poolConfig };
  }
}
```

## 🗄️ Ví dụ Query Database

### Sử dụng với TypeORM

```typescript
// product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  description: string;

  @Column()
  category: string;
}

// product.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { DatabaseService } from '@nestcm/database';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private databaseService: DatabaseService
  ) {}

  // Lấy tất cả sản phẩm
  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  // Lấy sản phẩm theo ID
  async findById(id: number): Promise<Product> {
    return this.productRepository.findOne({ where: { id } });
  }

  // Tìm kiếm sản phẩm theo tên
  async searchByName(name: string): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.name ILIKE :name', { name: `%${name}%` })
      .getMany();
  }

  // Lấy sản phẩm theo category
  async findByCategory(category: string): Promise<Product[]> {
    return this.productRepository.find({ where: { category } });
  }

  // Tạo sản phẩm mới
  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    return this.productRepository.save(product);
  }

  // Cập nhật sản phẩm
  async update(id: number, productData: Partial<Product>): Promise<Product> {
    await this.productRepository.update(id, productData);
    return this.findById(id);
  }

  // Xóa sản phẩm
  async delete(id: number): Promise<void> {
    await this.productRepository.delete(id);
  }

  // Lấy thống kê sản phẩm
  async getProductStats() {
    return this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(product.price)', 'avgPrice')
      .groupBy('product.category')
      .getRawMany();
  }
}
```

### Sử dụng với Prisma

```typescript
// prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '@nestcm/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private databaseService: DatabaseService) {
    super({
      datasources: {
        db: {
          url: databaseService.getConnectionString('product-service'),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// product.service.ts (với Prisma)
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Lấy tất cả sản phẩm
  async findAll() {
    return this.prisma.product.findMany();
  }

  // Lấy sản phẩm với category
  async findWithCategory() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
    });
  }

  // Tìm kiếm sản phẩm
  async searchProducts(query: string) {
    return this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }

  // Tạo sản phẩm mới
  async createProduct(data: any) {
    return this.prisma.product.create({
      data,
    });
  }

  // Cập nhật sản phẩm
  async updateProduct(id: number, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // Xóa sản phẩm
  async deleteProduct(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
```

### Sử dụng với Raw SQL

```typescript
// product.service.ts (với Raw SQL)
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@nestcm/database';
import { Pool } from 'pg';

@Injectable()
export class ProductService {
  private pool: Pool;

  constructor(private databaseService: DatabaseService) {
    const config = this.databaseService.getServiceDatabaseConfig('product-service');
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ...this.databaseService.getPoolConfig('product-service'),
    });
  }

  // Lấy tất cả sản phẩm
  async findAll() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM products ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Lấy sản phẩm theo ID
  async findById(id: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Tìm kiếm sản phẩm
  async searchProducts(query: string) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM products 
         WHERE name ILIKE $1 OR description ILIKE $1
         ORDER BY name`,
        [`%${query}%`]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Tạo sản phẩm mới
  async createProduct(productData: any) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO products (name, price, description, category, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [productData.name, productData.price, productData.description, productData.category]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Cập nhật sản phẩm
  async updateProduct(id: number, productData: any) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE products 
         SET name = $1, price = $2, description = $3, category = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [productData.name, productData.price, productData.description, productData.category, id]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Xóa sản phẩm
  async deleteProduct(id: number) {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM products WHERE id = $1', [id]);
      return { success: true };
    } finally {
      client.release();
    }
  }

  // Lấy thống kê sản phẩm
  async getProductStats() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          category,
          COUNT(*) as count,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM products 
        GROUP BY category 
        ORDER BY count DESC
      `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Transaction example
  async createProductWithInventory(productData: any, inventoryData: any) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Tạo sản phẩm
      const productResult = await client.query(
        `INSERT INTO products (name, price, description, category)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [productData.name, productData.price, productData.description, productData.category]
      );
      
      const productId = productResult.rows[0].id;
      
      // Tạo inventory record
      await client.query(
        `INSERT INTO inventory (product_id, quantity, location)
         VALUES ($1, $2, $3)`,
        [productId, inventoryData.quantity, inventoryData.location]
      );
      
      await client.query('COMMIT');
      
      return { productId, success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

## 🔧 Cấu hình Environment Variables

### Product Service
```env
PRODUCT_DB_HOST=localhost
PRODUCT_DB_PORT=5432
PRODUCT_DB_NAME=product_db
PRODUCT_DB_USER=postgres
PRODUCT_DB_PASSWORD=password
```

### Cart Service
```env
CART_DB_HOST=localhost
CART_DB_PORT=5432
CART_DB_NAME=cart_db
CART_DB_USER=postgres
CART_DB_PASSWORD=password
```

### Inventories Service
```env
INVENTORY_DB_HOST=localhost
INVENTORY_DB_PORT=5432
INVENTORY_DB_NAME=inventory_db
INVENTORY_DB_USER=postgres
INVENTORY_DB_PASSWORD=password
```

### Order Service
```env
ORDER_DB_HOST=localhost
ORDER_DB_PORT=5432
ORDER_DB_NAME=order_db
ORDER_DB_USER=postgres
ORDER_DB_PASSWORD=password
```

### Notification Service
```env
NOTIFICATION_DB_HOST=localhost
NOTIFICATION_DB_PORT=5432
NOTIFICATION_DB_NAME=notification_db
NOTIFICATION_DB_USER=postgres
NOTIFICATION_DB_PASSWORD=password
```

## 📊 Database Ports

- **Product DB**: 5431
- **Cart DB**: 5432  
- **Inventory DB**: 5433
- **Notification DB**: 5434
- **Order DB**: 5435

## 🔄 Override Pool Configuration

Mỗi service có thể override cấu hình pool mặc định:

```env
PRODUCT_SERVICE_DB_POOL_CONFIG={"maxConnections": 20, "minConnections": 5}
```

## 💡 Lợi ích

1. **Consistency**: Cấu hình database nhất quán giữa các service
2. **Maintainability**: Dễ dàng thay đổi cấu hình chung
3. **Environment Management**: Xử lý biến môi trường tập trung
4. **Connection Pooling**: Quản lý connection pool hiệu quả
5. **Type Safety**: TypeScript interfaces cho cấu hình

## 🚨 Lưu ý

- Mỗi service vẫn có database riêng biệt
- Lib này chỉ cung cấp cấu hình và utilities chung
- Không chia sẻ connection giữa các service
- Mỗi service tự quản lý connection pool của mình
- Sử dụng connection pooling để tối ưu hiệu suất
- Luôn release connection sau khi sử dụng
- Sử dụng transactions cho các operation phức tạp
