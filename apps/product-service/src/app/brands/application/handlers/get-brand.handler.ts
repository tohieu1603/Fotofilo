import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetBrandQuery } from "../queries/get-brand.query";
import { Inject, NotFoundException } from "@nestjs/common";
import { IBrandRepository } from "../../domain/repositories/brand.repository";
import { BrandAggregate } from "../../domain/aggregate/brand.aggregate";

@QueryHandler(GetBrandQuery)
export class GetBrandsHandler implements IQueryHandler<GetBrandQuery> {
    constructor(
        @Inject('BRAND_REPOSITORY')
        private readonly brandRepository: IBrandRepository
    ) {}

    async execute(query: GetBrandQuery): Promise<BrandAggregate> {
        const { id } = query;

        const data = await this.brandRepository.findById(id)

        if(!data) {
            throw new NotFoundException('No data')
        }

        return data
    }
}