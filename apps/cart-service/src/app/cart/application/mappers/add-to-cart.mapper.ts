import { AddToCartCommand } from '../commands/add-cart.command';
import { ItemDetail } from '../../domain/entities/cart-item-entity';

export interface AddToCartRequestDto {
  userId: string;
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
}

export class AddToCartMapper {
  static toCommand(dto: AddToCartRequestDto): AddToCartCommand {
    const itemDetail: ItemDetail | undefined = dto.itemDetail ? {
      name: dto.itemDetail.name,
      description: dto.itemDetail.description,
      image: dto.itemDetail.image,
      category: dto.itemDetail.category,
      brand: dto.itemDetail.brand,
      variants: dto.itemDetail.variants,
      attributes: dto.itemDetail.attributes,
    } : undefined;

    return new AddToCartCommand(
      dto.userId,
      dto.skuId,
      dto.quantity,
      dto.price,
      itemDetail
    );
  }
}