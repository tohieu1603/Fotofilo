import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateBrandCommand } from "../commands/create-brand.command";
import { Inject } from "@nestjs/common";
import { IBrandRepository } from "../../domain/repositories/brand.repository";
import { BrandAggregate } from "../../domain/aggregate/brand.aggregate";


@CommandHandler(CreateBrandCommand)
export class CreateBrandHandler implements ICommandHandler<CreateBrandCommand> {
    constructor(
        @Inject('BRAND_REPOSITORY')
        private readonly brandRepository: IBrandRepository
    ) {}
    async execute(command: CreateBrandCommand): Promise<BrandAggregate> {
        const { name, active } = command;

        const aggregate = BrandAggregate.create({name, active});
        const created = await this.brandRepository.create(aggregate)

        return created
    }
}