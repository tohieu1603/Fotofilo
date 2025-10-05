import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SortField {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetProductsQueryDto {
  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false, enum: SortField })
  @IsEnum(SortField)
  @IsOptional()
  sortField?: SortField;

  @ApiProperty({ required: false, enum: SortOrder })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;

  @ApiProperty({ required: false, type: Number })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiProperty({ required: false, type: Number })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;
}

