import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ItemDetailDto {
  @ApiProperty({ example: 'Sony Alpha A7 IV Pro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Professional full-frame mirrorless camera' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Sony', required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: 'Camera' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'https://example.com/camera.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { Type: 'Body Only', Color: 'Black' },
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @ApiProperty({
    type: 'object', 
    additionalProperties: { type: 'string' },
    example: { material: 'Magnesium alloy' },
  })
  @IsOptional()
  @IsObject()
  variants?: Record<string, string>;
}
