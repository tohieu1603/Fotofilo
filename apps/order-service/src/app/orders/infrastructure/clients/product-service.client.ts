import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Product as ProductProto } from '@nestcm/proto';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

export interface ProductInfo {
  id: string;
  name: string;
  sku: string;
  price: number;
  isAvailable: boolean;
  stock: number;
}

export interface ProductValidationRequest {
  productId: string;
  sku: string;
  quantity: number;
  skuId?: string; // Make skuId optional for backward compatibility
}

export interface ProductValidationResult {
  isValid: boolean;
  product?: ProductInfo;
  error?: string;
}

@Injectable()
export class ProductServiceClient implements OnModuleInit {
  private readonly logger = new Logger(ProductServiceClient.name);
  private productService: ProductProto.ProductServiceClient;

  constructor(
    @Inject('PRODUCT_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productService = this.client.getService<ProductProto.ProductServiceClient>('ProductService');
  }

  async validateProduct(request: ProductValidationRequest): Promise<ProductValidationResult> {
    try {
      this.logger.log('Validating product with gRPC:', request);

      // Basic validation
      if (!request.productId || !request.sku) {
        return {
          isValid: false,
          error: 'Product ID and SKU are required',
        };
      }

      if (request.quantity <= 0) {
        return {
          isValid: false,
          error: 'Quantity must be greater than 0',
        };
      }
      const skuValidationInput: ProductProto.SkuValidationInput = {
        skuId: request.skuId || request.sku,
        skuCode: request.sku,
        productId: request.productId,
        quantity: request.quantity,
      };

      const validateRequest: ProductProto.ValidateSkuInputRequest = {
        items: [skuValidationInput],
      };

      const validationResponse = await firstValueFrom(
        this.productService.validateSkuInputs(validateRequest, new Metadata())
      );

      if (!validationResponse.allValid) {
        const failedResult = validationResponse.results.find(r => !r.valid);
        return {
          isValid: false,
          error: failedResult?.message || 'SKU validation failed',
        };
      }

      const skuResult = validationResponse.results[0];
      if (!skuResult) {
        return {
          isValid: false,
          error: 'No validation result returned',
        };
      }

      if (request.quantity > skuResult.availableStock) {
        return {
          isValid: false,
          error: `Insufficient stock. Available: ${skuResult.availableStock}, Requested: ${request.quantity}`,
        };
      }

      const productInfo: ProductInfo = {
        id: skuResult.productId,
        name: skuResult.name,
        sku: skuResult.skuCode,
        price: skuResult.price,
        isAvailable: skuResult.inStock,
        stock: skuResult.availableStock,
      };

      return {
        isValid: true,
        product: productInfo,
      };

    } catch (error) {
      this.logger.error('Error validating product:', error);
      return {
        isValid: false,
        error: `Failed to validate product: ${error.message}`,
      };
    }
  }

  async validateProducts(requests: ProductValidationRequest[]): Promise<ProductValidationResult[]> {
    try {
      // Prepare batch validation request
      const skuInputs: ProductProto.SkuValidationInput[] = requests.map(request => ({
        skuId: request.skuId || request.sku,
        skuCode: request.sku,
        productId: request.productId,
        quantity: request.quantity,
      }));

      const validateRequest: ProductProto.ValidateSkuInputRequest = {
        items: skuInputs,
      };

      // Call gRPC service for batch validation
      const validationResponse = await firstValueFrom(
        this.productService.validateSkuInputs(validateRequest, new Metadata())
      );

      // Process results for each request
      const results: ProductValidationResult[] = [];

      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];

        // Check basic validation
        if (!request.productId || !request.sku || request.quantity <= 0) {
          results.push({
            isValid: false,
            error: 'Invalid request parameters',
          });
          continue;
        }

        // Find the corresponding result from the validation response
        const skuResult = validationResponse.results[i];
        if (!skuResult) {
          results.push({
            isValid: false,
            error: 'No validation result returned for this SKU',
          });
          continue;
        }

        // Check if this SKU was marked as invalid
        if (!skuResult.valid) {
          results.push({
            isValid: false,
            error: skuResult.message || `Invalid SKU: ${request.sku}`,
          });
          continue;
        }

        // Check stock availability
        if (request.quantity > skuResult.availableStock) {
          results.push({
            isValid: false,
            error: `Insufficient stock. Available: ${skuResult.availableStock}, Requested: ${request.quantity}`,
          });
          continue;
        }

        const productInfo: ProductInfo = {
          id: skuResult.productId,
          name: skuResult.name,
          sku: skuResult.skuCode,
          price: skuResult.price,
          isAvailable: skuResult.inStock,
          stock: skuResult.availableStock,
        };

        results.push({
          isValid: true,
          product: productInfo,
        });
      }

      return results;

    } catch (error) {
      this.logger.error('Error validating products:', error);
      // Return error for all requests
      return requests.map(() => ({
        isValid: false,
        error: `Failed to validate products: ${error.message}`,
      }));
    }
  }
}