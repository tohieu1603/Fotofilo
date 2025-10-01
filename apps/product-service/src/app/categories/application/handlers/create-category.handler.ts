import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCategoryCommand } from '../commands/create-category.command';
import { Inject } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository';
import { CategoryAggregate } from '../../domain/aggregates/category.aggregate';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(command: CreateCategoryCommand): Promise<CategoryAggregate> {
    const { name, slug, image, active, parentId } = command;
    // Create via factory to ensure domain validation
    const aggregate = CategoryAggregate.create({ name, slug, image, active, parentId });
    const created = await this.categoryRepository.create(aggregate);
    return created;
  }
}
