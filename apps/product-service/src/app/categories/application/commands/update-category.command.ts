import { ICommand } from '@nestjs/cqrs';

export class UpdateCategoryCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly slug?: string,
    public readonly image?: string,
    public readonly active?: boolean,
    public readonly parentId?: string
  ) {}
}