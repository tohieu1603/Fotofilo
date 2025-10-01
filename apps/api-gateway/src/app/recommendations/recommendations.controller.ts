import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { GetRecommendationsDto, RecommendationsResponseDto } from './dto';
import { OptionalJwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { GrpcClientExceptionFilter } from '../common/filters/grpc-exception.filter';

@ApiTags('Recommendations')
@ApiBearerAuth('access-token')
@Controller('recommendations')
@UseFilters(new GrpcClientExceptionFilter())
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get AI-powered product recommendations',
    description: `
      Get personalized product recommendations using AI/ML.
      - If user is logged in (has JWT): personalized recommendations based on history
      - If viewing a product: similar products + personalized mix
      - If no context: popular products
    `
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Current product being viewed'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of recommendations',
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Recommendations returned successfully',
    type: RecommendationsResponseDto
  })
  async getRecommendations(
    @Query() query: GetRecommendationsDto,
    @CurrentUser('userId') userId?: string
  ): Promise<RecommendationsResponseDto> {
    // userId từ JWT (nếu có), undefined nếu user chưa đăng nhập
    return this.recommendationsService.getRecommendations(
      userId,
      query.productId,
      query.limit
    );
  }

  @Get('me/history')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get my view history',
    description: 'Get current user\'s product view history'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'User history returned'
  })
  async getMyHistory(
    @CurrentUser('userId') userId: string,
    @Query('limit') limit: number = 10
  ) {
    if (!userId) {
      return {
        user_id: null,
        history: [],
        count: 0,
        message: 'Login required to view history'
      };
    }

    return this.recommendationsService.getUserHistory(userId, limit);
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get popular products',
    description: 'Get trending/popular products based on view count'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Popular products returned'
  })
  async getPopularProducts(@Query('limit') limit: number = 10) {
    return this.recommendationsService.getPopularProducts(limit);
  }
}