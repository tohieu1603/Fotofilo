import { Controller, Logger, Post, Get, Delete, Body, Param, HttpException, HttpStatus } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { AddToCartCommand, AddToCartResponseDto } from "../../application";
import { CartValidationError, SkuNotFoundError, InsufficientStockError } from "../../domain/exceptions/cart-validation.exception";
import { GetCartQuery } from "../../application/queries/get-cart.query";
import { DeleteCartCommand } from "../../application/commands/delete-cart.command";
import { ItemDetail } from "../../domain/entities/cart-item-entity";

interface AddToCartDto {
  userId: string;
  skuId: string;
  quantity: number;
  price?: number;
  itemDetail?: ItemDetail;
}

/**
 * REST Controller for Cart Service
 * Provides HTTP endpoints for cart operations
 */
@Controller('cart')
export class CartRestController {
  private readonly logger = new Logger(CartRestController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Add item to cart
   * POST /api/cart
   */
  @Post()
  async addToCart(@Body() dto: AddToCartDto) {
    try {
      this.logger.log(`Adding item to cart: userId=${dto.userId}, skuId=${dto.skuId}`);

      const command = new AddToCartCommand(
        dto.userId,
        dto.skuId,
        dto.quantity,
        dto.price,
        dto.itemDetail,
      );

      const response = await this.commandBus.execute(command) as AddToCartResponseDto;



      return response;
    } catch (error) {
      this.logger.error(`Failed to add to cart for user=${dto.userId}`, error);

      if (error instanceof SkuNotFoundError) {
        throw new HttpException({ message: error.message, invalidSkus: error.invalidSkus }, HttpStatus.NOT_FOUND);
      }

      if (error instanceof InsufficientStockError) {
        throw new HttpException({ message: error.message, invalidSkus: error.invalidSkus }, HttpStatus.CONFLICT);
      }

      if (error instanceof CartValidationError) {
        throw new HttpException({ message: error.message, invalidSkus: error.invalidSkus }, HttpStatus.BAD_REQUEST);
      }

      throw new HttpException('Failed to add item to cart', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get user's cart
   * GET /api/cart/:userId
   */
  @Get(':userId')
  async getCart(@Param('userId') userId: string) {
    try {
      this.logger.log(`Fetching cart for userId=${userId}`);

      const query = new GetCartQuery(userId);
      const cart = await this.queryBus.execute(query);

      if (!cart) {
        return {
          cart: null,
          message: 'Cart not found'
        };
      }

      // Transform domain cart to API response format
      const responseCart = {
        id: cart.id?.getValue ? cart.id.getValue() : cart.id,
        userId: cart.userId,
        items: cart.items?.map(item => ({
          id: item.id?.getValue ? item.id.getValue() : item.id,
          skuId: item.skuId,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          itemDetail: item.itemDetail,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })) || [],
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      };

      return {
        cart: responseCart,
        message: 'Cart retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to get cart for user=${userId}`, error.stack);
      throw new HttpException(
        'Failed to get cart',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Clear user's cart
   * DELETE /api/cart/:userId
   */
  @Delete(':userId')
  async clearCart(@Param('userId') userId: string) {
    try {
      this.logger.log(`Clearing cart for userId=${userId}`);

      const command = new DeleteCartCommand(userId);
      await this.commandBus.execute(command);

      return {
        message: "Cart cleared successfully",
      };
    } catch (error) {
      this.logger.error(`Failed to clear cart for user=${userId}`, error.stack);
      throw new HttpException(
        'Failed to clear cart',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

