import { ApiProperty } from '@nestjs/swagger';

export class RecommendationItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'product-abc'
  })
  product_id: string;

  @ApiProperty({
    description: 'Recommendation score (0-1)',
    example: 0.95
  })
  score: number;

  @ApiProperty({
    description: 'Reason for recommendation',
    example: 'ai_personalized',
    enum: ['ai_personalized', 'similar_category', 'same_brand', 'popular', 'based_on_history']
  })
  reason: string;
}

export class RecommendationsResponseDto {
  @ApiProperty({
    description: 'List of recommended products',
    type: [RecommendationItemDto]
  })
  recommendations: RecommendationItemDto[];

  @ApiProperty({
    description: 'User ID',
    required: false
  })
  userId?: string;

  @ApiProperty({
    description: 'Total recommendations returned'
  })
  total: number;
}