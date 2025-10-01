import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { DeleteBrandCommand } from "../commands/delete-brand.command";
import { Inject, NotFoundException } from "@nestjs/common";
import { IBrandRepository } from "../../domain/repositories/brand.repository";


@CommandHandler(DeleteBrandCommand)
export class DeleteBrandHandler implements ICommandHandler<DeleteBrandCommand> {
    constructor(
        @Inject('BRAND_REPOSITORY')
        private readonly brandRepository: IBrandRepository
    ) {}

    async execute(command: DeleteBrandCommand): Promise<{ success: boolean}> {
        const { id } = command

        const success = await this.brandRepository.delete(id)

        if(!success) {
            throw new NotFoundException('No data')
        }

        return { success: true }
    }
}