import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class AttributeInputDto {
  @IsString()
  @IsNotEmpty()
  attributeOptionId!: string;
}

export class CreateSkuInputDto {
  @IsString()
  @IsNotEmpty()
  skuCode!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock!: number;

  @IsString()
  @IsNotEmpty()
  image!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttributeInputDto)
  attributes!: AttributeInputDto[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  brandId!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSkuInputDto)
  skus!: CreateSkuInputDto[];
}
