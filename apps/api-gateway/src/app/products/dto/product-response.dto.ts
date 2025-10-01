import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from './product.dto';

export class CreateProductResponseDto {
  @ApiProperty({ type: ProductDto })
  product: ProductDto;

  @ApiProperty({ required: false })
  message?: string;
}

export class GetProductsResponseDto {
  @ApiProperty({ type: [ProductDto] })
  items: ProductDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class GetProductResponseDto {
  @ApiProperty({ type: ProductDto })
  product: ProductDto;
}