import { BrandEntity } from "../entities/brand.entity";
import { BrandAggregate } from "../../domain/aggregate/brand.aggregate";

export class BrandEntityMapper {
    static toDomain(entity: BrandEntity): BrandAggregate {
        return BrandAggregate.create({
            id: entity.id,
            name: entity.name,
            active: entity.active,
            deletedAt: entity.deletedAt ?? undefined,
        });
    }

    static toEntity(domain: BrandAggregate): BrandEntity {
        const entity = new BrandEntity();
        entity.id = domain.id;
        entity.name = domain.name;
        entity.active = domain.active;
        entity.deletedAt = domain.deletedAt ?? null;
        return entity;
    }
}
