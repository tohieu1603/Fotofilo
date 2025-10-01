/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { resolveProtoPath } from '@nestcm/proto';

async function bootstrap() {
  // Create gRPC microservice
  const grpcApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'inventory',
      protoPath: resolveProtoPath('proto/inventory.proto'),
      url: '0.0.0.0:50055',
    },
  });

  // Create Kafka microservice
  const kafkaApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'inventory-service',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: 'inventory-group',
      },
    },
  });

  await grpcApp.listen();
  await kafkaApp.listen();

  Logger.log('🚀 Inventory Service (gRPC) is running on: 0.0.0.0:50055');
  Logger.log(`🚀 Inventory Service (Kafka) is connected to: ${process.env.KAFKA_BROKER || 'localhost:9092'}`);
}
bootstrap();
