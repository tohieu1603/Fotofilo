import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrderInfrastructureModule } from '../infrastructure/order-infrastructure.module';
import { ProductServiceClient } from '../infrastructure/clients/product-service.client';
import { AddressServiceClient } from '../infrastructure/clients/address-service.client';
import { InventoryServiceClient } from '../infrastructure/clients/inventory-service.client';
import { PaymentServiceClient } from '../infrastructure/clients/payment-service.client';
import { OrderResponseMapper } from '../application/mappers/order-response.mapper';
import { OrderController } from './order.controller';
import { CommonModule } from '@nestcm/common';
import { KafkaService } from '../../common/kafka/kafka.service';
import { PaymentEventConsumer } from '../infrastructure/kafka/payment-event.consumer';

// Import Command Handlers
import { CreateOrderHandler } from '../application/handlers/create-order.handler';
import {
  UpdateOrderStatusHandler,
  AddOrderTrackingHandler,
  CancelOrderHandler,
} from '../application/handlers/order-command.handlers';
import {
  CommitOrderInventoryHandler,
  ReleaseOrderInventoryHandler,
} from '../application/handlers/inventory-lifecycle.handler';

// Import Query Handlers
import {
  GetOrderByIdHandler,
  GetOrderByNumberHandler,
  ListOrdersByCustomerHandler,
} from '../application/handlers/order-query.handlers';
import { resolveProtoPath } from '@nestcm/proto';

const CommandHandlers = [
  CreateOrderHandler,
  UpdateOrderStatusHandler,
  AddOrderTrackingHandler,
  CancelOrderHandler,
  CommitOrderInventoryHandler,
  ReleaseOrderInventoryHandler,
];

const QueryHandlers = [
  GetOrderByIdHandler,
  GetOrderByNumberHandler,
  ListOrdersByCustomerHandler,
];

@Module({
  imports: [
    CqrsModule,
    OrderInfrastructureModule,
    CommonModule,
    ClientsModule.register([
      {
        name: 'PRODUCT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'product',
          protoPath: resolveProtoPath('proto/product.proto'),
          url: process.env.PRODUCT_SERVICE_GRPC_URL || '0.0.0.0:50051',
        },
      },
      {
        name: 'ADDRESS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'address',
          protoPath: resolveProtoPath('proto/address.proto'),
          url: process.env.ADDRESS_SERVICE_GRPC_URL || '0.0.0.0:50052',
        },
      },
      {
        name: 'INVENTORY_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'inventory',
          protoPath: resolveProtoPath('proto/inventory.proto'),
          url: process.env.INVENTORY_SERVICE_GRPC_URL || '0.0.0.0:50055',
        },
      },
      {
        name: 'PAYMENT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'payment',
          protoPath: resolveProtoPath('proto/payment.proto'),
          url: process.env.PAYMENT_SERVICE_GRPC_URL || '0.0.0.0:50059',
        },
      },
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'order-service',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
          consumer: {
            groupId: 'order-consumer-group',
          },
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [
    ProductServiceClient,
    AddressServiceClient,
    InventoryServiceClient,
    PaymentServiceClient,
    OrderResponseMapper,
    KafkaService,
    PaymentEventConsumer,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    CqrsModule,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class OrderModule {}