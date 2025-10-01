import { Inject } from "@nestjs/common";
import { DeleteCartCommand } from "../commands/delete-cart.command";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ICartRepository } from "../../domain/repositories/cart.repository";


@CommandHandler(DeleteCartCommand)
export class DeleteCartHandler implements ICommandHandler<DeleteCartCommand> {
    constructor(
        @Inject('ICartRepository') private readonly cartRepository: ICartRepository
    ) {}
    async execute(command: DeleteCartCommand): Promise<boolean> {
        const { userId } = command;
        
        // Find cart by userId first
        const cart = await this.cartRepository.findByUserId(userId);
        if (!cart) {
            return true; // Cart doesn't exist, consider it deleted
        }
        
        const cartId = cart.id && typeof cart.id === 'object' && cart.id.getValue 
            ? cart.id.getValue() 
            : cart.id;
        
        return this.cartRepository.delete(cartId as string);
    }
}