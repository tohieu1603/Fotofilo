# Pagination Utility

Thư viện pagination chuẩn cho NestJS với TypeORM hỗ trợ đầy đủ tính năng.

## Features

- ✅ Pagination chuẩn với metadata đầy đủ
- ✅ Validation tự động cho parameters
- ✅ Hỗ trợ TypeORM out-of-the-box
- ✅ Sorting linh hoạt
- ✅ Swagger documentation tự động
- ✅ TypeScript types đầy đủ
- ✅ Configurable defaults và limits

## Installation

Thư viện đã được tích hợp sẵn trong `@nestcm/common`. Import và sử dụng:

```typescript
import { 
  PaginationUtil, 
  PaginationDto, 
  ApiPagination,
  PaginationResult 
} from '@nestcm/common';
```

## Quick Start

### 1. Trong Controller

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { PaginationDto, ApiPagination } from '@nestcm/common';

@Controller('products')
export class ProductsController {
  @Get()
  @ApiPagination() // Tự động thêm Swagger docs
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAllWithPagination(paginationDto);
  }
}
```

### 2. Trong Service với TypeORM

```typescript
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaginationUtil, PaginationOptions, PaginationResult } from '@nestcm/common';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  async findAllWithPagination(options: PaginationOptions): Promise<PaginationResult<Product>> {
    // Lấy TypeORM options
    const typeormOptions = PaginationUtil.getTypeOrmPaginationOptions(options);
    
    // Query database
    const [data, total] = await this.productRepository.findAndCount(typeormOptions);
    
    // Tạo kết quả pagination
    const normalizedOptions = PaginationUtil.normalizePaginationOptions(options);
    return PaginationUtil.createPaginationResult(
      data,
      total,
      normalizedOptions.page,
      normalizedOptions.limit
    );
  }
}
```

## API Reference

### PaginationDto

Query parameters cho pagination:

```typescript
class PaginationDto {
  page?: number = 1;        // Trang hiện tại
  limit?: number = 10;      // Số items per page (max: 100)
  sortBy?: string;          // Field để sort
  sortOrder?: 'ASC' | 'DESC' = 'ASC'; // Thứ tự sort
}
```

### PaginationResult<T>

Kết quả trả về:

```typescript
interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

### PaginationUtil Methods

#### `normalizePaginationOptions(options)`
Chuẩn hóa và validate pagination options.

#### `getTypeOrmPaginationOptions(options)`
Chuyển đổi sang TypeORM options (take, skip, order).

#### `createPaginationResult(data, total, page, limit)`
Tạo kết quả pagination hoàn chỉnh.

#### `validatePaginationParams(page, limit)`
Validate pagination parameters.

#### `generatePaginationLinks(baseUrl, currentPage, totalPages, queryParams)`
Tạo pagination links cho REST API.

## Advanced Usage

### Custom Sorting

```typescript
const options = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'DESC' as const
};

const result = await service.findAllWithPagination(options);
```

### With Search & Filters

```typescript
async findWithFilters(pagination: PaginationOptions, search?: string, category?: string) {
  const typeormOptions = PaginationUtil.getTypeOrmPaginationOptions(pagination);
  
  const queryBuilder = this.repository.createQueryBuilder('product');
  
  if (search) {
    queryBuilder.andWhere('product.name ILIKE :search', { search: \`%\${search}%\` });
  }
  
  if (category) {
    queryBuilder.andWhere('product.category = :category', { category });
  }
  
  // Apply pagination
  queryBuilder.take(typeormOptions.take);
  queryBuilder.skip(typeormOptions.skip);
  
  if (typeormOptions.order) {
    Object.entries(typeormOptions.order).forEach(([field, order]) => {
      queryBuilder.addOrderBy(\`product.\${field}\`, order);
    });
  }
  
  const [data, total] = await queryBuilder.getManyAndCount();
  
  const normalizedOptions = PaginationUtil.normalizePaginationOptions(pagination);
  return PaginationUtil.createPaginationResult(data, total, normalizedOptions.page, normalizedOptions.limit);
}
```

### Response với Links

```typescript
@Get()
@ApiPagination()
async findAll(@Query() paginationDto: PaginationDto, @Req() req: Request) {
  const result = await this.service.findAllWithPagination(paginationDto);
  
  // Thêm pagination links
  const baseUrl = \`\${req.protocol}://\${req.get('host')}\${req.originalUrl.split('?')[0]}\`;
  const links = PaginationUtil.generatePaginationLinks(
    baseUrl,
    result.pagination.currentPage,
    result.pagination.totalPages,
    { limit: paginationDto.limit, sortBy: paginationDto.sortBy }
  );
  
  return { ...result, links };
}
```

## Configuration

Các constants có thể customize trong `PaginationUtil`:

```typescript
PaginationUtil.DEFAULT_PAGE = 1;      // Trang mặc định
PaginationUtil.DEFAULT_LIMIT = 10;    // Limit mặc định  
PaginationUtil.MAX_LIMIT = 100;       // Limit tối đa
```

## Example Response

```json
{
  "data": [
    { "id": 1, "name": "Product 1" },
    { "id": 2, "name": "Product 2" }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "links": {
    "self": "https://api.example.com/products?page=1&limit=10",
    "first": "https://api.example.com/products?page=1&limit=10", 
    "last": "https://api.example.com/products?page=5&limit=10",
    "prev": null,
    "next": "https://api.example.com/products?page=2&limit=10"
  }
}
```
