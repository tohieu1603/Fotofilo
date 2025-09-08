import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ProductService } from './products/product.service';
import { ClientGrpc } from '@nestjs/microservices';
import { ProductController } from './products/product.controller';
import { PRODUCT_GRPC_SERVICE, PRODUCT_PACKAGE, PRODUCT_SERVICE_NAME } from './products/product.constants';
import { ProductGrpcService } from './products/product.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_PACKAGE,
        transport: Transport.GRPC,
        options: {
          url: process.env.PRODUCT_SERVICE_GRPC_URL || 'localhost:50051',
          package: 'product',
          protoPath: join(__dirname, '../../../../libs/proto/src/proto/product.proto'),
        },
      },
    ]),
  ],
  controllers: [ProductController],
  providers: [
    {
      provide: PRODUCT_GRPC_SERVICE,
      useFactory: (client: ClientGrpc) =>
        client.getService<ProductGrpcService>(PRODUCT_SERVICE_NAME),
      inject: [PRODUCT_PACKAGE],
    },
    ProductService,
  ],
})
export class AppModule {}
