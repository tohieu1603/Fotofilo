import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListCategoriesQuery } from '../queries/list-categories.query';
import { Inject } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository';
import { CategoryAggregate } from '../../domain/aggregates/category.aggregate';
import { PaginationResult } from '@nestcm/common';

@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(query: ListCategoriesQuery): Promise<PaginationResult<CategoryAggregate>> {
    const { page, limit, sortBy, sortOrder, parentId } = query;

    const paginatedResult = await this.categoryRepository.findAll(
      page,
      limit,
      sortBy,
      sortOrder,
      parentId
    );

    return paginatedResult;
  }
}
