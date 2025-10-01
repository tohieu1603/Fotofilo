import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCategoryCommand } from '../commands/delete-category.command';
import { Inject, NotFoundException } from '@nestjs/common';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(command: DeleteCategoryCommand): Promise<{ success: boolean }> {
    const { id } = command;

    const success = await this.categoryRepository.delete(id);

    if (!success) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return { success: true };
  }
}
