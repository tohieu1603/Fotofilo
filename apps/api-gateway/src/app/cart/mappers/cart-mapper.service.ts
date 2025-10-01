import { Injectable } from '@nestjs/common';
import { Cart } from '@nestcm/proto';
import { CartDto, CartItemDto, ItemDetailDto } from '../dtos';

@Injectable()
export class CartMapperService {

  /**
   * Convert proto to DTO - Main mapper
   */
  fromProtoToDto(grpcResponse: Cart.GetCartResponse | Cart.AddToCartResponse): CartDto {
    const cartEntity = grpcResponse.cart;
    const totalPrice = cartEntity?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;

    return {
      id: cartEntity?.id ?? '',
      userId: cartEntity?.userId ?? '',
      items: this.mapCartItems(cartEntity?.items ?? []),
      totalPrice,
      createdAt: cartEntity?.createdAt ?? new Date().toISOString(),
      updatedAt: cartEntity?.updatedAt ?? new Date().toISOString(),
    };
  }

  /**
   * Convert DTO to proto - Request mapper  
   */
  fromDtoToProto(body: Record<string, any>): Cart.AddToCartRequest {
    const { itemDetail, price, ...requiredFields } = body;

    const request: Cart.AddToCartRequest = {
      ...requiredFields,
      ...(typeof price === 'number' ? { price } : {}),
    } as Cart.AddToCartRequest;

    if (itemDetail) {
      request.itemDetail = {
        ...itemDetail,
      } as Cart.ItemDetail;
    }

    return request;
  }

  /**
   * Create empty response
   */
  createEmptyResponse(message: string): { message: string } {
    return { message };
  }

  /**
   * Private helper methods
   */
  private mapCartItems(grpcItems: Cart.CartItemEntity[] = []): CartItemDto[] {
    return grpcItems.map((item) => ({
      id: item.id ?? '',
      cartId: item.cartId ?? '',
      skuId: item.skuId ?? '',
      quantity: item.quantity ?? 0,
      price: item.price ?? 0,
      image: item.image ?? '',
      itemDetail: this.mapItemDetail(item.itemDetail),
      createdAt: item.createdAt ?? new Date().toISOString(),
      updatedAt: item.updatedAt ?? new Date().toISOString(),
    }));
  }

  private mapItemDetail(grpcDetail?: Cart.ItemDetail): ItemDetailDto {
    if (!grpcDetail) {
      return {
        name: '',
        description: '',
        brand: '',
        category: '',
        image: '',
        attributes: {},
        variants: {},
      };
    }

    return {
      name: grpcDetail.name ?? '',
      description: grpcDetail.description ?? '',
      brand: grpcDetail.brand ?? '',
      category: grpcDetail.category ?? '',
      image: grpcDetail.image ?? '',
      attributes: grpcDetail.attributes ?? {},
      variants: grpcDetail.variants ?? {},
    };
  }
}
