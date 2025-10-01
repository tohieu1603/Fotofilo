import { BrandAggregate } from "../../domain/aggregate/brand.aggregate";
import { Brand } from '@nestcm/proto';

export class BrandMapper {
    static toProto(domain: BrandAggregate): Brand.Brand {
        return {
            id: domain.id,
            name: domain.name,
            active: domain.active,
            deletedAt: domain.deletedAt ? domain.deletedAt.toISOString() : undefined,
        };
    }

    static toDomain(proto: Brand.Brand): BrandAggregate {
        return BrandAggregate.create({
            id: proto.id,
            name: proto.name,
            active: proto.active,
            deletedAt: proto.deletedAt ? new Date(proto.deletedAt) : undefined,
        });
    }

    static toResponse(domain: BrandAggregate): Brand.BrandResponse {
        return {
            id: domain.id,
            name: domain.name,
            active: domain.active,
        };
    }
}
