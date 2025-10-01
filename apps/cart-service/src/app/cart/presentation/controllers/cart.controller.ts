import { Controller, Logger } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status as GrpcStatus } from "@grpc/grpc-js";
import { Cart, Metadata } from "@nestcm/proto";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { AddToCartCommand, AddToCartResponseDto } from "../../application";
import { CartValidationError, SkuNotFoundError, InsufficientStockError } from "../../domain/exceptions/cart-validation.exception";
import { GetCartQuery } from "../../application/queries/get-cart.query";
import { DeleteCartCommand } from "../../application/commands/delete-cart.command";

/**
 * Description placeholder
 *
 * @export
 * @class CartController
 * @typedef {CartController}
 * @implements {Cart.CartServiceController}
 */
@Controller()
@Cart.CartServiceControllerMethods()
export class CartController implements Cart.CartServiceController {
    /**
 * Description placeholder
 *
 * @private
 * @readonly
 * @type {*}
 */
    private readonly logger = new Logger(CartController.name);

    /**
 * Creates an instance of CartController.
 *
 * @constructor
 * @param {CommandBus} commandBus 
 * @param {QueryBus} queryBus 
 */
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    /**
 * Description placeholder
 *
 * @async
 * @param {Cart.AddToCartRequest} request 
 * @returns {Promise<Cart.AddToCartResponse>} 
 */
    async addToCart(request: Cart.AddToCartRequest): Promise<Cart.AddToCartResponse> {
        try {
            this.logger.log(`Adding item to cart: userId=${request.userId}, skuId=${request.skuId}`);

            const command = new AddToCartCommand(
                request.userId,
                request.skuId,
                request.quantity,
                request.price,
                request.itemDetail,
            );

            const response = await this.commandBus.execute(command) as AddToCartResponseDto;

            return {
                cart: this.toProtoCart(response.cart),
                message: response.message ?? "Item added to cart successfully",
            };
        } catch (error) {
            this.logger.error(`Failed to add to cart for user=${request.userId}, skuId=${request.skuId}:`, error);
            throw this.toRpcException(error);
        }
    }

    /**
 * Description placeholder
 *
 * @async
 * @param {Cart.GetCartRequest} request 
 * @returns {Promise<Cart.GetCartResponse>} 
 */
    async getCart(request: Cart.GetCartRequest): Promise<Cart.GetCartResponse> {
        try {
            this.logger.log(`Fetching cart for userId=${request.userId}`);

            const query = new GetCartQuery(request.userId);
            const cart = await this.queryBus.execute(query);

            return {
            };
        } catch (error) {
            this.logger.error(`Failed to get cart for user=${request.userId}`, error.stack);
            return {
                cart: null,
            };
        }
    }
    async deleteCart(
        request: Cart.DeleteCartRequest,
        metadata: Metadata,
        ...rest: any
    ): Promise<Cart.DeleteCartResponse> {
        try {
            const command = new DeleteCartCommand(request.cartId);
            const success = await this.commandBus.execute(command);

            return {
                success: success || true,
            };
        } catch (error) {
            this.logger.error(`Failed to delete cart=${request.cartId}`, error.stack);
            return {
                success: false,
            };
        }
    }

    private toProtoCart(cart: AddToCartResponseDto["cart"]): Cart.CartEntity {
        return {
            id: cart.id,
            userId: cart.userId,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
            items: cart.items.map(item => ({
                id: item.id,
                cartId: item.cartId,
                skuId: item.skuId,
                quantity: item.quantity,
                price: item.price,
                image: item.itemDetail?.image ?? "",
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                itemDetail: item.itemDetail ? this.toProtoItemDetail(item.itemDetail) : undefined,
            })),
        };
    }
    private toRpcException(error: unknown): RpcException {
        if (error instanceof SkuNotFoundError) {
            return new RpcException({
                code: GrpcStatus.NOT_FOUND,
                message: error.message,
                details: JSON.stringify({ invalidSkus: error.invalidSkus }),
            });
        }

        if (error instanceof InsufficientStockError) {
            return new RpcException({
                code: GrpcStatus.FAILED_PRECONDITION,
                message: error.message,
                details: JSON.stringify({ invalidSkus: error.invalidSkus }),
            });
        }

        if (error instanceof CartValidationError) {
            return new RpcException({
                code: GrpcStatus.INVALID_ARGUMENT,
                message: error.message,
                details: JSON.stringify({ invalidSkus: error.invalidSkus }),
            });
        }

        const message = error instanceof Error ? error.message : 'Failed to add item to cart';
        return new RpcException({
            code: GrpcStatus.INTERNAL,
            message,
        });
    }

    private toProtoItemDetail(detail: NonNullable<AddToCartResponseDto["cart"]["items"][number]["itemDetail"]>): Cart.ItemDetail {
        const normalizeRecord = (record?: Record<string, unknown>): Record<string, string> => {
            if (!record) {
                return {};
            }

            return Object.entries(record).reduce<Record<string, string>>((acc, [key, value]) => {
                acc[key] = value !== undefined && value !== null ? String(value) : "";
                return acc;
            }, {});
        };

        return {
            name: detail.name,
            description: detail.description ?? "",
            brand: detail.brand ?? "",
            category: detail.category ?? "",
            image: detail.image ?? "",
            attributes: normalizeRecord(detail.attributes),
            variants: normalizeRecord(detail.variants),
        };
    }
}
