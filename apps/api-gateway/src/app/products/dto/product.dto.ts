import { ApiProperty } from '@nestjs/swagger';
import { SkuDto } from './sku.dto';

export class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  slug?: string;

  @ApiProperty({ type: Number })
  price: number;

  @ApiProperty({ required: false })
  brandId?: string;

  @ApiProperty({ required: false })
  categoryId?: string;

  @ApiProperty({ type: [SkuDto], required: false })
  skus?: SkuDto[];

  @ApiProperty({ type: [String], required: false })
  images?: string[];

  @ApiProperty({ required: false, type: Object })
  attributes?: Record<string, string[]>;

  @ApiProperty()
  createdAt?: string;

  @ApiProperty()
  updatedAt?: string;
}