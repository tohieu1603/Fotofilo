import { ApiProperty } from '@nestjs/swagger';
import { CartItemDto } from './cart-item.dto';

export class CartDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [CartItemDto] })
  items: CartItemDto[];

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}