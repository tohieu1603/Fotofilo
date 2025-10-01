import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { normalizePagination } from '../shared/pagination/pagination.util';
import { Product as ProductProto } from '@nestcm/proto';

@Controller()
@ProductProto.ProductServiceControllerMethods()
export class ProductsController implements ProductProto.ProductServiceController {
  constructor(private readonly productsService: ProductsService) {}

  createProduct(request: ProductProto.CreateProductRequest): Promise<ProductProto.CreateProductResponse> {
    return this.productsService.createProductWithSkus(request);
  }

  getProduct(request: ProductProto.GetProductRequest): Promise<ProductProto.GetProductResponse> {
    return this.productsService.getProduct(request.id);
  }

  async getProducts(request: ProductProto.GetAllProductsRequest): Promise<ProductProto.GetAllProductsResponse> {
    const { page, limit } = normalizePagination(request?.page, request?.limit);
    return this.productsService.listProducts(
      page,
      limit,
      request?.keyword,
      request?.brandId,
      request?.categoryId,
    );
  }

  updateProduct(request: ProductProto.UpdateProductRequest): Promise<ProductProto.UpdateProductResponse> {
    return this.productsService.updateProduct(request.id, request);
  }

  deleteProduct(request: ProductProto.DeleteProductRequest): Promise<ProductProto.DeleteProductResponse> {
    return this.productsService.deleteProduct(request.id);
  }

  validateSkuInputs(request: ProductProto.ValidateSkuInputRequest): Promise<ProductProto.ValidateSkuInputResponse> {
    return this.productsService.validateSkuInputs(request);
  }

  getProductSku(request: ProductProto.GetProductSkuRequest): Promise<ProductProto.GetProductSkuResponse> {
    throw new Error('Method not implemented.');
  }

  getProductSkus(request: ProductProto.ListSkuRequest): Promise<ProductProto.ListSkuResponse> {
    throw new Error('Method not implemented.');
  }

  @Get('products/skus/:skuId')
  async checkSku(@Param('skuId') skuId: string) {
    const result = await this.productsService.getSkuDetail(skuId);
    return {
      message: 'SKU lookup successful',
      ...result,
    };
  }

  // REST endpoints
  @Post('products')
  async createProductRest(@Body() body: any): Promise<ProductProto.CreateProductResponse> {
    return this.productsService.createProductWithSkus(body);
  }

  @Get('products/:id')
  async getProductRest(@Param('id') id: string): Promise<ProductProto.GetProductResponse> {
    return this.productsService.getProduct(id);
  }

  @Get('products')
  async getProductsRest(): Promise<ProductProto.GetAllProductsResponse> {
    return this.productsService.listProducts(1, 100);
  }

  @Put('products/:id')
  async updateProductRest(@Param('id') id: string, @Body() body: any): Promise<ProductProto.UpdateProductResponse> {
    return this.productsService.updateProduct(id, body);
  }

  @Delete('products/:id')
  async deleteProductRest(@Param('id') id: string): Promise<ProductProto.DeleteProductResponse> {
    return this.productsService.deleteProduct(id);
  }

  existingSku(request: ProductProto.CheckSkuAvailabilityRequest): Promise<ProductProto.CheckSkuAvailabilityResponse> {
    return this.productsService.existingSku(request);
  }
}
