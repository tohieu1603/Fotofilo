import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCategoryCommand } from '../commands/update-category.command';
import { Inject, NotFoundException } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository';
import { CategoryAggregate } from '../../domain/aggregates/category.aggregate';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<CategoryAggregate> {
    const { id, name, slug, image, active, parentId } = command;

    const updatedCategory = await this.categoryRepository.update(id, {
      name,
      slug,
      image,
      active,
      parentId
    });

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return updatedCategory;
  }
}
