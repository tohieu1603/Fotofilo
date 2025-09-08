export { 
  ProductService,
  CreateProductRequest,
  CreateProductResponse,
  GetProductRequest,
  GetProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  DeleteProductRequest,
  DeleteProductResponse,
  GetAllProductsRequest,
  GetAllProductsResponse,
  CreateSkuInput,
  SkuResponse,
  AttributeInput,
  SkuOptionResponse,
  ProductServiceClientImpl,
  ProductServiceServiceName,
  AttributeDetail,
    GetProductSkuRequest,
  GetProductSkuResponse,
  ListSkuRequest,
  ListSkuResponse,
  ValidateSkuInputRequest,
  ValidateSkuInputResponse,
  
} from './generated/product';

export { 
  CommonResponse,
  PaginationRequest,
  Error,
  Timestamp,
  Money
} from './generated/common';

// Export specific gRPC types
export { 
  ClientGrpc, 
  ClientOptions, 
  Transport,
  GrpcOptions,
  GrpcMethod,
  GrpcStreamMethod
} from '@nestjs/microservices';

export { 
  credentials, 
  Metadata, 
  status,
  ServiceClientConstructor,
  GrpcObject
} from '@grpc/grpc-js';
