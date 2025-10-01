import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UpdateBrandCommand } from "../commands/update-brand.command";
import { Inject, NotFoundException } from "@nestjs/common";
import { IBrandRepository } from "../../domain/repositories/brand.repository";
import { BrandAggregate } from "../../domain/aggregate/brand.aggregate";


@CommandHandler(UpdateBrandCommand)
export class UpdateBrandHandler implements ICommandHandler<UpdateBrandCommand> {
    constructor(
        @Inject('BRAND_REPOSITORY')
        private readonly brandRepository: IBrandRepository
    ) { }

    async execute(command: UpdateBrandCommand): Promise<BrandAggregate> {

        const updateCategory = await this.brandRepository.update(command.id, { ...command })

        if (!updateCategory) {
            throw new NotFoundException('Brand Not Found')
        }

        return updateCategory
    }
}