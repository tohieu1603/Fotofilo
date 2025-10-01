import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { BrandEntity } from "../entities/brand.entity";
import { BrandAggregate, BrandCreate } from "../../domain/aggregate/brand.aggregate";
import { BrandEntityMapper } from "../mappers/brand.entity.mapper";
import { IBrandRepository } from "../../domain/repositories/brand.repository";
import { PaginationResult } from "@nestcm/common";

export class BrandTypeOrmRepository implements IBrandRepository {
    constructor(
        @InjectRepository(BrandEntity)
        private readonly repository: Repository<BrandEntity>,
    ) { }

    async create(aggregate: BrandAggregate): Promise<BrandAggregate> {
        const entity = BrandEntityMapper.toEntity(aggregate);
        const saved = await this.repository.save(entity);
        return BrandEntityMapper.toDomain(saved);
    }
    async findById(id: string): Promise<BrandAggregate | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return BrandEntityMapper.toDomain(entity);
    }
    async findAll(keyword: string, page: number, limit: number): Promise<PaginationResult<BrandAggregate>> {
        const [entities, total] = await this.repository.findAndCount({
            where: keyword ? { name: ILike(`%${keyword}%`) } : {},
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        })
        const data = entities.map(BrandEntityMapper.toDomain);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        }
    }
    async update(id: string, brand: Partial<BrandCreate>): Promise<BrandAggregate> {
        const preloaded = await this.repository.preload({ id, ...brand });
        if (!preloaded) {
            throw new Error(`Brand with id ${id} not found`);
        }
        const saved = await this.repository.save(preloaded);
        return BrandEntityMapper.toDomain(saved);
    }
    async delete(id: string): Promise<boolean> {
       const success = await this.repository.delete(id);

       return success.affected > 0
    }
}