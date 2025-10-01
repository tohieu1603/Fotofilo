import { PaginationOptions, PaginationResult, PaginationMeta } from './pagination.interface';

/**
 * Utility class for handling pagination
 */
export class PaginationUtil {
  /**
   * Default pagination values
   */
  static readonly DEFAULT_PAGE = 1;
  static readonly DEFAULT_LIMIT = 10;
  static readonly MAX_LIMIT = 100;

  /**
   * Normalize pagination options with defaults and validation
   */
  static normalizePaginationOptions(options: PaginationOptions = {}): Required<Omit<PaginationOptions, 'sortBy' | 'sortOrder'>> & Pick<PaginationOptions, 'sortBy' | 'sortOrder'> {
    const page = Math.max(1, options.page || this.DEFAULT_PAGE);
    const limit = Math.min(this.MAX_LIMIT, Math.max(1, options.limit || this.DEFAULT_LIMIT));
    
    return {
      page,
      limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder || 'ASC',
    };
  }

  /**
   * Calculate skip value for database queries
   */
  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Calculate pagination metadata
   */
  static calculatePaginationMeta(
    totalItems: number,
    currentPage: number,
    itemsPerPage: number
  ): PaginationMeta {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }

  /**
   * Create a complete pagination result
   */
  static createPaginationResult<T>(
    data: T[],
    totalItems: number,
    currentPage: number,
    itemsPerPage: number
  ): PaginationResult<T> {
    const pagination = this.calculatePaginationMeta(totalItems, currentPage, itemsPerPage);
    
    return {
      data,
      pagination,
    };
  }

  /**
   * Get TypeORM pagination options
   */
  static getTypeOrmPaginationOptions(options: PaginationOptions) {
    const normalizedOptions = this.normalizePaginationOptions(options);
    
    return {
      take: normalizedOptions.limit,
      skip: this.calculateSkip(normalizedOptions.page, normalizedOptions.limit),
      order: normalizedOptions.sortBy ? {
        [normalizedOptions.sortBy]: normalizedOptions.sortOrder
      } : undefined,
    };
  }

  /**
   * Validate pagination parameters
   */
  static validatePaginationParams(page?: number, limit?: number): void {
    if (page !== undefined && (page < 1 || !Number.isInteger(page))) {
      throw new Error('Page must be a positive integer');
    }
    
    if (limit !== undefined && (limit < 1 || limit > this.MAX_LIMIT || !Number.isInteger(limit))) {
      throw new Error(`Limit must be a positive integer between 1 and ${this.MAX_LIMIT}`);
    }
  }

  /**
   * Generate pagination links (useful for REST APIs)
   */
  static generatePaginationLinks(
    baseUrl: string,
    currentPage: number,
    totalPages: number,
    queryParams: Record<string, string | number | boolean> = {}
  ) {
    const createUrl = (page: number) => {
      const url = new URL(baseUrl);
      Object.entries({ ...queryParams, page }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
      return url.toString();
    };

    return {
      self: createUrl(currentPage),
      first: createUrl(1),
      last: createUrl(totalPages),
      prev: currentPage > 1 ? createUrl(currentPage - 1) : null,
      next: currentPage < totalPages ? createUrl(currentPage + 1) : null,
    };
  }
}
