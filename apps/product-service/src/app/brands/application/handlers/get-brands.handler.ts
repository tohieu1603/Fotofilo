import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetBrandsQuery } from "../queries/get-brands.query";
import { Inject } from "@nestjs/common";
import { IBrandRepository } from "../../domain/repositories/brand.repository";
import { BrandAggregate } from "../../domain/aggregate/brand.aggregate";
import { PaginationResult } from "@nestcm/common";



@QueryHandler(GetBrandsQuery)
export class GetBrandsHandler implements IQueryHandler<GetBrandsQuery> {
    constructor(
        @Inject('BRAND_REPOSITORY')
        private readonly brandRepository: IBrandRepository
    ) {}

    async execute(query: GetBrandsQuery): Promise<PaginationResult<BrandAggregate>> {
        const { keyword, page, limit } = query;

        const result = await this.brandRepository.findAll(keyword, page, limit)

        return result
    }
}