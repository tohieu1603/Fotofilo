/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification-service',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: 'notification-consumer-group',
      },
    },
  });

  // Also start as HTTP server for health checks
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3011;

  await app.startAllMicroservices();
  await app.listen(port);

  Logger.log(`🚀 Notification Service is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log('🎧 Kafka microservice is listening for events');
}
bootstrap();
