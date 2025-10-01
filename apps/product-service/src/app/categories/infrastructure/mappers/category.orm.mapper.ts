import { CategoryAggregate as DomainCategory } from '../../domain/aggregates/category.aggregate';
import { CategoryEntity } from '../entities/category.entity';

export class CategoryOrmMapper {
  static toDomain(entity: CategoryEntity): DomainCategory {
    return DomainCategory.create({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      image: entity.image ?? undefined,
      active: entity.active,
      parentId: entity.parentId ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
      children: entity.children?.map((child) => this.toDomain(child)) ?? [],
    });
  }

  static toOrm(domain: Partial<DomainCategory>): Partial<CategoryEntity> {
    const base: Partial<CategoryEntity> = {
      name: domain.name!,
      slug: domain.slug!,
      image: domain.image,
      active: (domain.active as boolean) ?? true,
      parentId: domain.parentId,
    };
    if (domain.id) {
      (base as any).id = domain.id;
    }
    return base;
  }
}
