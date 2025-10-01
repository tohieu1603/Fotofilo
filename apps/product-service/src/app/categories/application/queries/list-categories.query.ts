import { IQuery } from '@nestjs/cqrs';

export class ListCategoriesQuery implements IQuery {
  constructor(
    public readonly page = 1,
    public readonly limit = 10,
    public readonly sortBy = 'createdAt',
    public readonly sortOrder: 'ASC' | 'DESC' = 'DESC',
    public readonly parentId?: string
  ) {}
}