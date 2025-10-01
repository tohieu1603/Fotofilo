import { PaginationResult } from '@nestcm/common';
import { CategoryAggregate } from '../aggregates/category.aggregate';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository {
  create(categoryData: Partial<CategoryAggregate>): Promise<CategoryAggregate>;
  findById(id: string): Promise<CategoryAggregate | null>;
  findAll(
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    parentId?: string
  ): Promise<PaginationResult<CategoryAggregate>>;
  update(id: string, categoryData: Partial<CategoryAggregate>): Promise<CategoryAggregate | null>;
  delete(id: string): Promise<boolean>;
}
