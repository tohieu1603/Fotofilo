import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { Product, resolveProtoPath } from '@nestcm/proto';
import { PRODUCT_PACKAGE_NAME } from 'libs/proto/src/generated/product';
import { ItemDetail } from '../../domain/entities/cart-item-entity';
import {
  CartValidationError,
  InsufficientStockError,
  SkuNotFoundError,
} from '../../domain/exceptions/cart-validation.exception';

interface VerifySkuParams {
  skuId: string;
  quantity: number;
}

export interface VerifiedSku {
  productId: string;
  skuId: string;
  skuCode: string;
  price: number;
  availableStock: number;
  itemDetail: ItemDetail;
}

export interface IProductServiceClient {
  verifySku(params: VerifySkuParams): Promise<VerifiedSku>;
}

@Injectable()
export class ProductServiceClient implements OnModuleInit, IProductServiceClient {
  private readonly logger = new Logger(ProductServiceClient.name);
  private productService: Product.ProductServiceClient;

  @Client({
    transport: Transport.GRPC,
    options: {
      package: PRODUCT_PACKAGE_NAME,
      protoPath: resolveProtoPath('proto/product.proto'),
      url: process.env.PRODUCT_SERVICE_GRPC_URL ?? 'localhost:50051',
    },
  })
  private client: ClientGrpc;

  onModuleInit(): void {
    this.productService = this.client.getService<Product.ProductServiceClient>('ProductService');
  }

  async verifySku({ skuId, quantity }: VerifySkuParams): Promise<VerifiedSku> {
    const trimmedSkuId = skuId?.trim();

    if (!trimmedSkuId) {
      throw new SkuNotFoundError(skuId ?? '');
    }

    const normalizedQuantity = quantity > 0 ? quantity : 1;

    let availability: Product.CheckSkuAvailabilityResponse;

    try {
      availability = await firstValueFrom(
        this.productService.existingSku(
          {
            skuId: trimmedSkuId,
            quantity: normalizedQuantity,
          },
          this.buildMetadata(),
        ),
      );
    } catch (error) {
      this.logger.error(
        `[ProductServiceClient] SKU verification gRPC failure for ${trimmedSkuId}`,
        error,
      );
      throw new CartValidationError(
        `Unable to verify SKU ${trimmedSkuId}`,
        [trimmedSkuId],
      );
    }

    if (!availability?.exists) {
      throw new SkuNotFoundError(trimmedSkuId);
    }

    const availableStock = availability.availableStock ?? 0;

    if (!availability.inStock) {
      throw new InsufficientStockError(trimmedSkuId, normalizedQuantity, availableStock);
    }

    if (availability.price === undefined || availability.price === null) {
      throw new CartValidationError(
        `Price information missing for SKU ${trimmedSkuId}`,
        [trimmedSkuId],
      );
    }

    if (!availability.productId) {
      throw new CartValidationError(
        `Product information missing for SKU ${trimmedSkuId}`,
        [trimmedSkuId],
      );
    }

    const price = Number(availability.price);

    if (Number.isNaN(price)) {
      throw new CartValidationError(
        `Price information invalid for SKU ${trimmedSkuId}`,
        [trimmedSkuId],
      );
    }

    const itemDetail = this.buildItemDetail(availability);

    return {
      productId: availability.productId,
      skuId: trimmedSkuId,
      skuCode: availability.skuCode?.trim() || trimmedSkuId,
      price,
      availableStock,
      itemDetail,
    };
  }

  private buildMetadata(): Metadata {
    const metadata = new Metadata();
    metadata.add('service', 'cart-service');
    return metadata;
  }

  private buildItemDetail(availability: Product.CheckSkuAvailabilityResponse): ItemDetail {
    const attributes: Record<string, unknown> = {};

    (availability.skuOptions ?? []).forEach((option) => {
      if (!option) {
        return;
      }

      const key = option.attribute?.name ?? option.attributeOptionId ?? 'attribute';
      attributes[key] = option.attributeOptionValue;
    });

    return {
      name: availability.productName ?? '',
      description: availability.description ?? '',
      brand: availability.brandId ?? '',
      category: availability.categoryId ?? '',
      attributes,
      variants: { ...attributes },
    };
  }
}
