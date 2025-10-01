import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResult, PaginationUtil } from '@nestcm/common';
import { CategoryEntity } from '../entities/category.entity';
import { ICategoryRepository } from '../../domain/repositories/category.repository';
import { CategoryAggregate as DomainCategory } from '../../domain/aggregates/category.aggregate';
import { CategoryOrmMapper } from '../mappers/category.orm.mapper';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: Repository<CategoryEntity>
  ) {}

  async create(categoryData: Partial<DomainCategory>): Promise<DomainCategory> {
    const category = this.repository.create({
      name: categoryData.name,
      slug: categoryData.slug,
      image: categoryData.image,
      active: categoryData.active ?? true,
      parentId: categoryData.parentId,
    });
    const saved = await this.repository.save(category);
    return CategoryOrmMapper.toDomain(saved);
  }

  async findById(id: string): Promise<DomainCategory | null> {
    const entity = await this.repository.findOne({ 
      where: { id },
      relations: ['parent', 'children']
    });
    return entity ? CategoryOrmMapper.toDomain(entity) : null;
  }

  async findAll(
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    parentId?: string
  ): Promise<PaginationResult<DomainCategory>> {
    const queryBuilder = this.repository.createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children');

    if (parentId) {
      queryBuilder.where('category.parentId = :parentId', { parentId });
    }

    // Apply sorting
    if (sortBy) {
      queryBuilder.orderBy(`category.${sortBy}`, sortOrder);
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get data
    const data = await queryBuilder.getMany();
    const mapped = data.map((e) => CategoryOrmMapper.toDomain(e));
    return PaginationUtil.createPaginationResult(mapped, total, page, limit);
  }

  async update(id: string, categoryData: Partial<DomainCategory>): Promise<DomainCategory | null> {
    await this.repository.update(id, {
      name: categoryData.name,
      slug: categoryData.slug,
      image: categoryData.image,
      active: categoryData.active,
      parentId: categoryData.parentId,
    });
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return result.affected > 0;
  }
}
