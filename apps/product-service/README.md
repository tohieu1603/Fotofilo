# Product Service - TypeORM Integration

Hướng dẫn chi tiết cách kết nối và sử dụng TypeORM trong Product Service.

## 🎯 Tổng quan

Product Service sử dụng TypeORM để tương tác với PostgreSQL database. Mỗi service có database riêng biệt theo kiến trúc microservices.

## 🚀 Cài đặt Dependencies

### 1. Cài đặt TypeORM packages

```bash
npm install @nestjs/typeorm typeorm pg
npm install --save-dev @types/pg
```

### 2. Cài đặt database library

```bash
# Đã có sẵn trong monorepo
# libs/database
```

## 🔧 Cấu hình TypeORM

### 1. Cập nhật app.module.ts

```typescript
// apps/product-service/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from '../product/product.module';
import { DatabaseModule } from '@nestcm/database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [DatabaseModule],
      useFactory: (databaseService: DatabaseService) => {
        const config = databaseService.getServiceDatabaseConfig('product-service');
        return {
          type: 'postgres',
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: config.database,
          schema: config.schema,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: process.env.NODE_ENV === 'development', // Chỉ true trong development
          logging: process.env.NODE_ENV === 'development',
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [DatabaseService],
    }),
    ProductModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 2. Tạo Product Entity

```typescript
// apps/product-service/src/product/entities/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('products')
@Index(['name', 'category']) // Composite index
@Index(['price']) // Index cho price để tối ưu queries
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ length: 100, nullable: false })
  category: string;

  @Column({ length: 100, nullable: true })
  brand: string;

  @Column({ length: 50, nullable: true })
  sku: string;

  @Column('int', { default: 0 })
  stock_quantity: number;

  @Column({ length: 20, default: 'active' })
  status: string; // active, inactive, discontinued

  @Column('jsonb', { nullable: true })
  attributes: Record<string, any>; // Flexible attributes

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column({ length: 255, nullable: true })
  image_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ default: false })
  is_featured: boolean;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column('int', { default: 0 })
  review_count: number;
}
```

### 3. Tạo Product Module

```typescript
// apps/product-service/src/product/product.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
```

### 4. Tạo Product Service

```typescript
// apps/product-service/src/product/product.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Between, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Tạo sản phẩm mới
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  // Lấy tất cả sản phẩm với pagination và filtering
  async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Category filter
    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    // Brand filter
    if (brand) {
      queryBuilder.andWhere('product.brand = :brand', { brand });
    }

    // Price range filter
    if (minPrice || maxPrice) {
      if (minPrice && maxPrice) {
        queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
          minPrice,
          maxPrice,
        });
      } else if (minPrice) {
        queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
      } else if (maxPrice) {
        queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
      }
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    // Sorting
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy sản phẩm theo ID
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  // Cập nhật sản phẩm
  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  // Xóa sản phẩm
  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  // Tìm kiếm sản phẩm theo tên
  async searchByName(name: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { name: ILike(`%${name}%`) },
      order: { name: 'ASC' },
    });
  }

  // Lấy sản phẩm theo category
  async findByCategory(category: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { category },
      order: { name: 'ASC' },
    });
  }

  // Lấy sản phẩm theo brand
  async findByBrand(brand: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { brand },
      order: { name: 'ASC' },
    });
  }

  // Lấy sản phẩm theo price range
  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return await this.productRepository.find({
      where: { price: Between(minPrice, maxPrice) },
      order: { price: 'ASC' },
    });
  }

  // Lấy sản phẩm featured
  async getFeaturedProducts(): Promise<Product[]> {
    return await this.productRepository.find({
      where: { is_featured: true, status: 'active' },
      order: { rating: 'DESC' },
      take: 10,
    });
  }

  // Lấy thống kê sản phẩm
  async getProductStats() {
    const stats = await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(product.price)', 'avgPrice')
      .addSelect('MIN(product.price)', 'minPrice')
      .addSelect('MAX(product.price)', 'maxPrice')
      .addSelect('SUM(product.stock_quantity)', 'totalStock')
      .groupBy('product.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return stats;
  }

  // Cập nhật stock quantity
  async updateStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    product.stock_quantity += quantity;
    
    if (product.stock_quantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }
    
    return await this.productRepository.save(product);
  }

  // Bulk update products
  async bulkUpdate(ids: number[], updateData: Partial<Product>): Promise<Product[]> {
    await this.productRepository.update(ids, updateData);
    return await this.productRepository.findByIds(ids);
  }

  // Get products by multiple IDs
  async findByIds(ids: number[]): Promise<Product[]> {
    return await this.productRepository.find({
      where: { id: In(ids) },
    });
  }
}
```

## 📝 DTOs (Data Transfer Objects)

### 1. Create Product DTO

```typescript
// apps/product-service/src/product/dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsUrl, Min, Max } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  attributes?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUrl()
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}
```

### 2. Update Product DTO

```typescript
// apps/product-service/src/product/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

### 3. Product Query DTO

```typescript
// apps/product-service/src/product/dto/product-query.dto.ts
import { IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProductQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['name', 'price', 'created_at', 'rating'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: string;
}
```

## 🔧 Environment Variables

Tạo file `.env` trong thư mục `apps/product-service/`:

```env
# Database Configuration
PRODUCT_DB_HOST=localhost
PRODUCT_DB_PORT=5431
PRODUCT_DB_NAME=product_db
PRODUCT_DB_USER=postgres
PRODUCT_DB_PASSWORD=password

# Application Configuration
NODE_ENV=development
PORT=3001

# TypeORM Configuration
TYPEORM_SYNCHRONIZE=true
TYPEORM_LOGGING=true
```

## 🗄️ Database Schema

### 1. Tạo database

```sql
-- Kết nối vào PostgreSQL
psql -U postgres -h localhost -p 5431

-- Tạo database
CREATE DATABASE product_db;

-- Kết nối vào database
\c product_db

-- Tạo schema
CREATE SCHEMA IF NOT EXISTS product;
```

### 2. Migration (nếu cần)

```bash
# Tạo migration
npx typeorm migration:create -n CreateProductTable

# Chạy migration
npx typeorm migration:run

# Revert migration
npx typeorm migration:revert
```

## 🧪 Testing

### 1. Unit Tests

```typescript
// apps/product-service/src/product/product.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';

describe('ProductService', () => {
  let service: ProductService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Thêm các test cases khác...
});
```

## 🚀 Chạy Service

### 1. Development Mode

```bash
# Chạy service
npx nx serve product-service

# Hoặc chạy tất cả services
npx nx run-many --target=serve --all
```

### 2. Docker Mode

```bash
# Chạy với docker-compose
docker-compose up product-service product-db

# Hoặc chạy tất cả
docker-compose up
```

## 📊 API Endpoints

Service sẽ có các endpoints sau:

- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy sản phẩm theo ID
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm
- `GET /api/products/search?q=keyword` - Tìm kiếm sản phẩm
- `GET /api/products/stats` - Thống kê sản phẩm

## 🔍 Monitoring & Logging

### 1. TypeORM Logging

```typescript
// Trong app.module.ts
TypeOrmModule.forRootAsync({
  // ... other config
  useFactory: () => ({
    // ... other options
    logging: process.env.NODE_ENV === 'development',
    logger: 'advanced-console', // hoặc 'file'
  }),
}),
```

### 2. Query Performance

```typescript
// Enable query logging
logging: ['query', 'error', 'warn', 'schema', 'migration'],

// Enable slow query logging
maxQueryExecutionTime: 1000, // Log queries slower than 1 second
```

## 🚨 Troubleshooting

### 1. Connection Issues

```bash
# Kiểm tra database connection
psql -U postgres -h localhost -p 5431 -d product_db

# Kiểm tra logs
docker-compose logs product-db
```

### 2. Migration Issues

```bash
# Reset database
npx typeorm schema:drop

# Re-run migrations
npx typeorm migration:run
```

### 3. Performance Issues

- Kiểm tra indexes
- Sử dụng query optimization
- Monitor slow queries
- Tối ưu connection pool

## 📚 Tài liệu tham khảo

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)
