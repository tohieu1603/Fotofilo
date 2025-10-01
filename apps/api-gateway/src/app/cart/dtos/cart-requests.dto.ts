import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CartDto } from './cart-main.dto';
import { ItemDetailDto } from './item-detail.dto';

const normaliseId = (legacyKey: string) =>
  Transform(({ value, obj }) => {
    if (value) return value;
    if (obj[legacyKey]) {
      const normalised = obj[legacyKey];
      delete obj[legacyKey];
      return normalised;
    }
    return value;
  });

export class AddToCartDto {
  // userId will be extracted from JWT token, not from request body
  userId?: string;

  @ApiProperty({ example: 'sku-123' })
  @IsString()
  @IsNotEmpty()
  @normaliseId('sku_id')
  skuId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false, example: 1499.99, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ type: ItemDetailDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ItemDetailDto)
  itemDetail?: ItemDetailDto;
}

export class GetCartRequestDto {
  // userId will be extracted from JWT token, not from request body
  userId?: string;
}

export class AddToCartResponseDto {
  @ApiProperty({ type: CartDto })
  cart: CartDto;

  @ApiProperty()
  message: string;
}

export class GetCartResponseDto {
  @ApiProperty({ type: CartDto })
  cart: CartDto;
}
