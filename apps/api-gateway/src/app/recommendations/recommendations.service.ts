import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { RecommendationsResponseDto } from './dto';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly mlServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://ml-service:8000';
  }

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(
    userId?: string,
    productId?: string,
    limit: number = 10
  ): Promise<RecommendationsResponseDto> {
    try {
      const url = `${this.mlServiceUrl}/api/v1/recommendations`;

      this.logger.log(`Getting recommendations for user ${userId}, product ${productId}`);

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(url, {
          user_id: userId,
          product_id: productId,
          limit
        })
      );

      const data: any = response.data;

      return {
        recommendations: data.recommendations || [],
        userId: data.user_id,
        total: data.recommendations?.length || 0
      };

    } catch (error) {
      this.logger.error(`Error getting recommendations: ${error.message}`);

      // Fallback: return empty array
      return {
        recommendations: [],
        userId,
        total: 0
      };
    }
  }

  /**
   * Get user's view history
   */
  async getUserHistory(userId: string, limit: number = 10) {
    try {
      const url = `${this.mlServiceUrl}/api/v1/user/${userId}/history`;

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(url, {
          params: { limit }
        })
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Error getting user history: ${error.message}`);
      return {
        user_id: userId,
        history: [],
        count: 0
      };
    }
  }

  /**
   * Get popular products
   */
  async getPopularProducts(limit: number = 10) {
    try {
      const url = `${this.mlServiceUrl}/api/v1/products/popular`;

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(url, {
          params: { limit }
        })
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Error getting popular products: ${error.message}`);
      return {
        popular_products: [],
        count: 0
      };
    }
  }
}