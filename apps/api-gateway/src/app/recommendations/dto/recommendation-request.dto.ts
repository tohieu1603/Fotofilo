import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRecommendationsDto {
  @ApiProperty({
    description: 'User ID for personalized recommendations (from JWT)',
    required: false,
    example: 'user-123'
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Current product ID being viewed',
    required: false,
    example: 'product-456'
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({
    description: 'Number of recommendations to return',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 50
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}