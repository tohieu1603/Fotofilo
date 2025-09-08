import { Inject, Injectable, RequestTimeoutException } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import {
  CreateProductRequest,
  CreateProductResponse,
  DeleteProductRequest,
  DeleteProductResponse,
  GetAllProductsRequest,
  GetAllProductsResponse,
  GetProductRequest,
  GetProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  GetProductSkuRequest,
  GetProductSkuResponse,
  ListSkuRequest,
  ListSkuResponse,
  ValidateSkuInputRequest,
  ValidateSkuInputResponse,
} from '@nestcm/proto';
import { timeout } from 'rxjs/operators';
import { PRODUCT_GRPC_SERVICE } from './product.constants';

export interface ProductGrpcService {
  CreateProduct(req: CreateProductRequest): Observable<CreateProductResponse>;
  GetProduct(req: GetProductRequest): Observable<GetProductResponse>;
  GetProducts(req: GetAllProductsRequest): Observable<GetAllProductsResponse>;
  ValidateSkuInputs(req: ValidateSkuInputRequest): Observable<ValidateSkuInputResponse>;
  GetProductSku(req: GetProductSkuRequest): Observable<GetProductSkuResponse>;
  GetProductSkus(req: ListSkuRequest): Observable<ListSkuResponse>;
  UpdateProduct(req: UpdateProductRequest): Observable<UpdateProductResponse>;
  DeleteProduct(req: DeleteProductRequest): Observable<DeleteProductResponse>;
}

@Injectable()
export class ProductService {
  constructor(@Inject(PRODUCT_GRPC_SERVICE) private readonly svc: ProductGrpcService) {}

  private async unary<T>(obs: Observable<T>, ms = 5000): Promise<T> {
    try {
      return await lastValueFrom(obs.pipe(timeout(ms)));
    } catch (err: any) {
      // Let the global/controller filter map gRPC errors. Map timeouts explicitly.
      if (err?.name === 'TimeoutError') {
        throw new RequestTimeoutException('Upstream service timeout');
      }
      throw err;
    }
  }

  createProduct(req: CreateProductRequest) {
    return this.unary(this.svc.CreateProduct(req));
  }
  getProduct(req: GetProductRequest) {
    return this.unary(this.svc.GetProduct(req));
  }
  getProducts(req: GetAllProductsRequest) {
    return this.unary(this.svc.GetProducts(req));
  }
  validateSkuInputs(req: ValidateSkuInputRequest) {
    return this.unary(this.svc.ValidateSkuInputs(req));
  }
  getProductSku(req: GetProductSkuRequest) {
    return this.unary(this.svc.GetProductSku(req));
  }
  getProductSkus(req: ListSkuRequest) {
    return this.unary(this.svc.GetProductSkus(req));
  }
  updateProduct(req: UpdateProductRequest) {
    return this.unary(this.svc.UpdateProduct(req));
  }
  deleteProduct(req: DeleteProductRequest) {
    return this.unary(this.svc.DeleteProduct(req));
  }
  get grpc() {
    return this.svc;
  }
}
