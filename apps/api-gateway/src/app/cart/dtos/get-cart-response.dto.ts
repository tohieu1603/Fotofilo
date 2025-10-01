import { ApiProperty } from '@nestjs/swagger';
import { CartDto } from './cart-main.dto';

export class GetCartResponseDto {
  @ApiProperty({ type: CartDto })
  cart: CartDto;
}
