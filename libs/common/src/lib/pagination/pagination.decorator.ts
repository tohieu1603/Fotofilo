import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

/**
 * Swagger decorator for pagination query parameters
 */
export function ApiPagination() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page (default: 10, max: 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Sort order (default: ASC)',
      example: 'DESC',
    }),
  );
}
