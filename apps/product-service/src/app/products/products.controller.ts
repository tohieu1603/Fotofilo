import { Controller } from '@nestjs/common';
import { Product as ProductProto, Metadata } from '@nestcm/proto';
import { ProductsService } from './products.service';

@Controller()
@ProductProto.ProductServiceControllerMethods()
export class ProductsGrpcController implements ProductProto.ProductServiceController {
  constructor(private readonly productsService: ProductsService) {}

  createProduct(request: ProductProto.CreateProductRequest) {
    return this.productsService.createProductWithSkus(request);
  }

  getProduct(request: ProductProto.GetProductRequest) {
    return this.productsService.getProduct(request.id);
  }

  async getProducts(request: ProductProto.GetAllProductsRequest) {
    return this.productsService.listProducts(
      request.page,
      request.limit,
      request.keyword,
      request.brandId,
      request.categoryId,
      request.sortField,
      request.sortOrder,
      request.minPrice,
      request.maxPrice,
    );
  }

  updateProduct(request: ProductProto.UpdateProductRequest) {
    return this.productsService.updateProduct(request.id, request);
  }

  deleteProduct(request: ProductProto.DeleteProductRequest) {
    return this.productsService.deleteProduct(request.id);
  }

  validateSkuInputs(request: ProductProto.ValidateSkuInputRequest) {
    return this.productsService.validateSkuInputs(request);
  }

  existingSku(request: ProductProto.CheckSkuAvailabilityRequest) {
    return this.productsService.existingSku(request);
  }

  getAttributes(): Promise<ProductProto.GetAttributesResponse> {
    return this.productsService.getAttribute();
  }

  async getAttributeOptions(
    request: ProductProto.GetAttributeOptionsRequest,
    metadata: Metadata,
  ): Promise<ProductProto.GetAttributeOptionsResponse> {
    return this.productsService.getAttributeOptions(request.attributeId);
  }
}
