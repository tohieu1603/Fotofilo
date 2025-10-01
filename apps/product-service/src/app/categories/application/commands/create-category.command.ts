import { ICommand } from '@nestjs/cqrs';

export class CreateCategoryCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly image: string,
    public readonly active: boolean,
    public readonly parentId: string
  ) {}
}