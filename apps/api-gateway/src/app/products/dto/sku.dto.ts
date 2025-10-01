import { ApiProperty } from '@nestjs/swagger';
import { AttributeDto } from './attribute.dto';

export class SkuDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  skuCode: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  image: string

  @ApiProperty({ type: [Object], required: false })
  attributes?: AttributeDto[];
}