import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { timeout } from 'rxjs/operators';
import { Metadata, Product } from '@nestcm/proto';
import { ClientGrpc } from '@nestjs/microservices';
import { from, lastValueFrom } from 'rxjs';

@Injectable()
export class ProductService implements OnModuleInit {
  private productService: Product.ProductServiceClient;


  constructor(@Inject(Product.PRODUCT_PACKAGE_NAME) private readonly client: ClientGrpc) { }
  onModuleInit() {
    this.productService = this.client.getService<Product.ProductServiceClient>(Product.PRODUCT_SERVICE_NAME);
  }

  createProduct(req: Product.CreateProductRequest): Promise<Product.CreateProductResponse> {
    return lastValueFrom(
      from(this.productService.createProduct(req, new Metadata)).pipe(
        timeout(5000)
      )
    );
  }
  getProduct(req: Product.GetProductRequest): Promise<Product.GetProductResponse> {
    return lastValueFrom(
      from(this.productService.getProduct(req, new Metadata)).pipe(
        timeout(5000)
      )
    );
  }
  getProducts(req: Product.GetAllProductsRequest): Promise<Product.GetAllProductsResponse> {
    return lastValueFrom(
      from(this.productService.getProducts(req, new Metadata)).pipe(
        timeout(5000)
      )
    );
  }
  updateProduct(req: Product.UpdateProductRequest): Promise<Product.UpdateProductResponse> {
    return lastValueFrom(
      from(this.productService.updateProduct(req, new Metadata)).pipe(
        timeout(5000)
      )
    )
  }
  deleteProduct(req: Product.DeleteProductRequest): Promise<Product.DeleteProductResponse> {
    return lastValueFrom(
      from(this.productService.deleteProduct(req, new Metadata)).pipe(
        timeout(5000)
      )
    );
  }
  async getAttribute(): Promise<Product.GetAttributesResponse> {
    return lastValueFrom(
      from(this.productService.getAttributes({}, new Metadata)).pipe(
        timeout(5000)
      )
    );
  }
  async getAttributeOptions(attributeId: string): Promise<Product.GetAttributeOptionsResponse> {
    return lastValueFrom(
      from(this.productService.getAttributeOptions({ attributeId }, new Metadata)).pipe(
        timeout(5000)
      )
    );
  }
}
