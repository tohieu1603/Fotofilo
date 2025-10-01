export * as Auth from './generated/auth';
export * as Brand from './generated/brand';
export * as Cart from './generated/cart';
export * as Category from './generated/category';
export * as Common from './generated/common';
export * as Inventory from './generated/inventory';
export * as Order from './generated/order';
export * as Product from './generated/product';
export * as Recommendation from './generated/recommendation';
export * as User from './generated/user';
export * as Address from './generated/address'; 
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
  loadPackageDefinition
} from '@grpc/grpc-js';

export { loadSync as protoLoader } from '@grpc/proto-loader';

export { resolveProtoPath, resolveProtoPaths } from './utils/proto-path.util';

