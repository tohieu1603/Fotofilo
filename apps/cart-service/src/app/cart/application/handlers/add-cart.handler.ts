import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";

import { AddToCartCommand } from "../commands/add-cart.command";
import { AddToCartResponseDto, AddToCartResponseMapper } from "../mappers";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { Cart, CartItem } from "../../domain";
import { CartValidationError } from "../../domain/exceptions/cart-validation.exception";
import {
  IProductServiceClient,
  VerifiedSku,
} from "../../infrastructure/clients/product-service.client";
import { ItemDetail } from "../../domain/entities/cart-item-entity";

@CommandHandler(AddToCartCommand)
export class AddToCartHandler implements ICommandHandler<AddToCartCommand> {
  private readonly logger = new Logger(AddToCartHandler.name);

  constructor(
    @Inject('ICartRepository') private readonly cartRepository: ICartRepository,
    @Inject('IProductServiceClient') private readonly productServiceClient: IProductServiceClient,
  ) {}

  async execute(command: AddToCartCommand): Promise<AddToCartResponseDto> {
    const { userId, skuId, quantity } = command;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new CartValidationError(
        `Quantity must be a positive integer. Received: ${quantity}`,
        [],
      );
    }

    try {
      this.logger.log(
        `[AddToCartHandler] Verifying SKU ${skuId} with quantity ${quantity} for user ${userId}`,
      );

      const verifiedSku = await this.productServiceClient.verifySku({
        skuId,
        quantity,
      });

      const price = verifiedSku.price;
      if (price === undefined || Number.isNaN(price)) {
        throw new CartValidationError(
          `Price resolution failed for SKU ${skuId}`,
          [skuId],
        );
      }

      const itemDetail = this.mergeItemDetail(
        verifiedSku.itemDetail,
        command.itemDetail,
      );

      let cart = await this.cartRepository.findByUserId(userId);

      if (!cart) {
        this.logger.log(`[AddToCartHandler] Creating new cart for user: ${userId}`);
        cart = Cart.create(userId);
      }

      const cartId =
        cart.id && typeof cart.id === 'object' && cart.id.getValue
          ? cart.id.getValue()
          : cart.id;

      const cartItem = CartItem.create(
        cartId as string,
        skuId,
        verifiedSku.productId,
        verifiedSku.skuCode,
        quantity,
        price,
        itemDetail,
      );

      cart = cart.addItem(cartItem);
      await this.cartRepository.save(cart);

      this.logger.log(
        `[AddToCartHandler] Added SKU ${skuId} to cart for user ${userId}`,
      );

      return AddToCartResponseMapper.fromDomain(cart);
    } catch (error) {
      this.logger.error(
        `[AddToCartHandler] Failed to add item to cart for ${userId}:`,
        error,
      );

      if (error instanceof CartValidationError) {
        throw error;
      }

      throw new Error(
        `Failed to add item to cart: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private mergeItemDetail(base: ItemDetail, overrides?: ItemDetail): ItemDetail {
    if (!overrides) {
      return base;
    }

    return {
      ...base,
      ...overrides,
      attributes: {
        ...(base.attributes ?? {}),
        ...(overrides.attributes ?? {}),
      },
      variants: {
        ...(base.variants ?? {}),
        ...(overrides.variants ?? {}),
      },
    };
  }
}
