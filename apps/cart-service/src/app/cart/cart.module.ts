import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CartEntity, CartItemEntity } from "./infrastructure/entities";
import { CartController } from "./presentation/controllers/cart.controller";
import { CartRestController } from "./presentation/controllers/cart-rest.controller";
import { AddToCartHandler, GetCartHandler } from "./application/handlers";
import { CartRepository } from "./infrastructure/repositories/cart.repository";
import { DeleteCartHandler } from "./application/handlers/delete-cart.handler";
import { ProductServiceClient } from "./infrastructure/clients/product-service.client";

const CommandHandlers = [
    AddToCartHandler,
    DeleteCartHandler
];

const QueryHandlers = [
    GetCartHandler
];

const Repositories = [
    {
        provide: 'ICartRepository',
        useClass: CartRepository, 
    }
];

const ExternalServices = [
    {
        provide: 'IProductServiceClient',
        useClass: ProductServiceClient,
    }
];

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([
            CartEntity,
            CartItemEntity
        ]),
    ],
    controllers: [CartController, CartRestController],
    providers: [
        ...CommandHandlers,
        ...QueryHandlers,
        ...Repositories,
        ...ExternalServices
    ],
    exports: [
        ...Repositories,
        ...ExternalServices
    ]
})
export class CartModule {}