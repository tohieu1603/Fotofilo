import { ApiProperty } from '@nestjs/swagger';
import { CartDto } from './cart-main.dto';

export class AddToCartResponseDto {
  @ApiProperty({ type: CartDto })
  cart: CartDto;

  @ApiProperty()
  message: string;
}
