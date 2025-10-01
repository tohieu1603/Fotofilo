/**
 * Example usage of Pagination utilities
 * 
 * This file demonstrates how to use the pagination utilities in your services and controllers
 */

import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { 
  PaginationUtil, 
  PaginationOptions, 
  PaginationResult,
  PaginationDto,
  ApiPagination
} from './index';

// Example Entity
interface ExampleEntity {
  id: number;
  name: string;
  createdAt: Date;
}

@Injectable()
export class ExampleService {
  constructor(
    private readonly repository: Repository<ExampleEntity>
  ) {}

  /**
   * Example using TypeORM with pagination
   */
  async findAllWithPagination(options: PaginationOptions): Promise<PaginationResult<ExampleEntity>> {
    // Normalize and validate options
    const normalizedOptions = PaginationUtil.normalizePaginationOptions(options);
    
    // Get TypeORM options
    const typeormOptions = PaginationUtil.getTypeOrmPaginationOptions(options);
    
    // Execute query
    const [data, total] = await this.repository.findAndCount(typeormOptions);
    
    // Create pagination result
    return PaginationUtil.createPaginationResult(
      data,
      total,
      normalizedOptions.page,
      normalizedOptions.limit
    );
  }

  /**
   * Example using manual array pagination
   */
  async findAllManual(options: PaginationOptions): Promise<PaginationResult<ExampleEntity>> {
    const normalizedOptions = PaginationUtil.normalizePaginationOptions(options);
    
    // Get all data (in real scenario, you might want to optimize this)
    const allData = await this.repository.find();
    
    // Apply sorting if specified
    if (normalizedOptions.sortBy) {
      allData.sort((a, b) => {
        const aValue = a[normalizedOptions.sortBy as keyof ExampleEntity];
        const bValue = b[normalizedOptions.sortBy as keyof ExampleEntity];
        
        if (normalizedOptions.sortOrder === 'DESC') {
          return aValue > bValue ? -1 : 1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }
    
    // Calculate pagination
    const skip = PaginationUtil.calculateSkip(normalizedOptions.page, normalizedOptions.limit);
    const paginatedData = allData.slice(skip, skip + normalizedOptions.limit);
    
    return PaginationUtil.createPaginationResult(
      paginatedData,
      allData.length,
      normalizedOptions.page,
      normalizedOptions.limit
    );
  }
}

// Example Controller
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  /**
   * Example controller method with pagination
   */
  @ApiPagination() // Swagger documentation
  async findAll(paginationDto: PaginationDto) {
    // Validate pagination parameters
    PaginationUtil.validatePaginationParams(paginationDto.page, paginationDto.limit);
    
    const result = await this.exampleService.findAllWithPagination(paginationDto);
    
    // Optional: Add pagination links for REST API
    const links = PaginationUtil.generatePaginationLinks(
      'https://api.example.com/items',
      result.pagination.currentPage,
      result.pagination.totalPages,
      { limit: paginationDto.limit, sortBy: paginationDto.sortBy }
    );
    
    return {
      ...result,
      links
    };
  }
}

/**
 * Example response structure:
 * {
 *   "data": [...],
 *   "pagination": {
 *     "currentPage": 1,
 *     "totalPages": 10,
 *     "totalItems": 100,
 *     "itemsPerPage": 10,
 *     "hasNextPage": true,
 *     "hasPreviousPage": false
 *   },
 *   "links": {
 *     "self": "https://api.example.com/items?page=1&limit=10",
 *     "first": "https://api.example.com/items?page=1&limit=10",
 *     "last": "https://api.example.com/items?page=10&limit=10",
 *     "prev": null,
 *     "next": "https://api.example.com/items?page=2&limit=10"
 *   }
 * }
 */
