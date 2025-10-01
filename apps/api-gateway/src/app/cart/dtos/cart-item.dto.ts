import { ApiProperty } from '@nestjs/swagger';
import { ItemDetailDto } from './item-detail.dto';

export class CartItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cartId: string;

  @ApiProperty()
  skuId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  image: string;

  @ApiProperty({ type: ItemDetailDto })
  itemDetail: ItemDetailDto;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}