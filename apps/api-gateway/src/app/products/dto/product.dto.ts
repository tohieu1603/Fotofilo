import { ApiProperty } from '@nestjs/swagger';
import { SkuDto } from './sku.dto';
import { BrandDto } from './brand.dto';
import { CategoryDto } from './category.dto';

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

  @ApiProperty({ type: Number, required: false })
  originalPrice?: number;

  @ApiProperty({ type: BrandDto, required: false })
  brand?: BrandDto;

  @ApiProperty({ type: CategoryDto, required: false })
  category?: CategoryDto;

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