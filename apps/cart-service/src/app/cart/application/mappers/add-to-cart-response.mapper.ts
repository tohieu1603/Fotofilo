import { Cart } from '../../domain';

export interface AddToCartResponseDto {
  cart: {
    id: string;
    userId: string;
    items: Array<{
      id: string;
      cartId: string;
      skuId: string;
      quantity: number;
      price: number;
      itemDetail?: {
        name: string;
        description?: string;
        image?: string;
        category?: string;
        brand?: string;
        variants?: Record<string, unknown>;
        attributes?: Record<string, unknown>;
      };
      createdAt: string;
      updatedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export class AddToCartResponseMapper {
  static fromDomain(cart: Cart, message = 'Item added successfully'): AddToCartResponseDto {
    return {
      cart: {
        id: cart.id.getValue(),
        userId: cart.userId,
        items: cart.items.map(item => ({
          id: item.id.getValue(),
          cartId: item.cartId,
          skuId: item.skuId,
          quantity: item.quantity,
          price: item.price,
          itemDetail: item.itemDetail ? {
            name: item.itemDetail.name,
            description: item.itemDetail.description,
            image: item.itemDetail.image,
            category: item.itemDetail.category,
            brand: item.itemDetail.brand,
            variants: item.itemDetail.variants,
            attributes: item.itemDetail.attributes,
          } : undefined,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString(),
      },
      message,
    };
  }
}