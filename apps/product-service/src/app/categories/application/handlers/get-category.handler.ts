import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetCategoryQuery } from '../queries/get-category.query';
import { Inject, NotFoundException } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository';
import { CategoryAggregate } from '../../domain/aggregates/category.aggregate';

@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(query: GetCategoryQuery): Promise<CategoryAggregate> {
    const { id } = query;

    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }
}
