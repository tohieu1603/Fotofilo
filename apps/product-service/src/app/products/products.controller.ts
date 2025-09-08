import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { normalizePagination } from '../shared/pagination/pagination.util';
import { CreateProductRequest, CreateProductResponse, DeleteProductRequest, DeleteProductResponse, GetAllProductsRequest, GetAllProductsResponse, GetProductRequest, GetProductResponse, ProductService, ProductServiceServiceName, UpdateProductRequest, UpdateProductResponse } from '@nestcm/proto';
import { GetProductSkuRequest, GetProductSkuResponse, ListSkuRequest, ListSkuResponse, ValidateSkuInputRequest, ValidateSkuInputResponse } from 'libs/proto/src/generated/product';

@Controller('products')
export class ProductsController implements ProductService {
  constructor(private readonly productsService: ProductsService) {
    
  }
  CreateProduct(@Body() request: CreateProductRequest): Promise<CreateProductResponse> {
    return this.productsService.createProductWithSkus(request);
  }
  GetProduct(request: GetProductRequest): Promise<GetProductResponse> {
    return this.productsService.getProduct(request.id);
  }

  async GetProducts(request: GetAllProductsRequest): Promise<GetAllProductsResponse> {
    const { page, limit } = normalizePagination(request?.page, request?.limit);
    const res = await this.productsService.listProducts(
      page,
      limit,
      request?.keyword,
      request?.brandId,
      request?.categoryId,
    );
    return res;
  }
  UpdateProduct(request: UpdateProductRequest): Promise<UpdateProductResponse> {
    return this.productsService.updateProduct(request.id, request);
  }  
  DeleteProduct(request: DeleteProductRequest): Promise<DeleteProductResponse> {
    return this.productsService.deleteProduct(request.id);
  }
  ValidateSkuInputs(request: ValidateSkuInputRequest): Promise<ValidateSkuInputResponse> {
      throw new Error('Method not implemented.');
  }
  GetProductSku(request: GetProductSkuRequest): Promise<GetProductSkuResponse> {
      throw new Error('Method not implemented.');
  }
  GetProductSkus(request: ListSkuRequest): Promise<ListSkuResponse> {
      throw new Error('Method not implemented.');
  }
}
