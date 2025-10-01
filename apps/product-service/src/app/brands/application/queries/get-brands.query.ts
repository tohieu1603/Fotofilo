import { IQuery } from "@nestjs/cqrs";


export class GetBrandsQuery implements IQuery{
    constructor(
        public readonly keyword?: string,
        public readonly page = 1,
        public readonly limit = 10,
    ) {}
}