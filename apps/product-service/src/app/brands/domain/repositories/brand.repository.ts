import { PaginationResult } from "@nestcm/common";
import { BrandAggregate } from "../aggregate/brand.aggregate";


export const BRAND_REPOSITORY = 'BRAND_REPOSITORY';
export interface IBrandRepository {
    create(data: Partial<BrandAggregate>): Promise<BrandAggregate>;
    findById(id: string): Promise<BrandAggregate | null>;
    findAll(
        keyword: string,
        page: number,
        limit: number,
    ): Promise<PaginationResult<BrandAggregate>>;
    update(id: string, brand: Partial<BrandAggregate>): Promise<BrandAggregate | null>;
    delete(id: string): Promise<boolean>;
}