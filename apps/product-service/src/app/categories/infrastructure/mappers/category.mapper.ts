import { Category as CategoryProto } from '@nestcm/proto';
import { CategoryAggregate as DomainCategory } from '../../domain/aggregates/category.aggregate';

export class CategoryMapper {
  static toProto(domain: DomainCategory): CategoryProto.Category {
    return {
      id: domain.id || '',
      name: domain.name,
      slug: domain.slug,
      image: domain.image || '',
      active: !!domain.active,
      parentId: domain.parentId || '',
      deletedAt: domain.deletedAt?.toISOString() || '',
      children: domain.children?.map((child) => this.toProto(child)) || [],
    };
  }

  static toResponse(domain: DomainCategory): CategoryProto.CategoryResponse {
    return {
      id: domain.id || '',
      name: domain.name,
      slug: domain.slug,
      image: domain.image || '',
      active: !!domain.active,
      parentId: domain.parentId || '',
    };
  }
}
