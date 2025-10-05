import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { resolveProtoPaths } from '@nestcm/proto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // gRPC Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'payment',
      protoPath: resolveProtoPaths(['proto/payment.proto']),
      url: process.env.GRPC_URL || '0.0.0.0:50059',
    },
  });

  await app.startAllMicroservices();
  Logger.log('Payment Service gRPC running on port 50059');

  // HTTP for health checks
  const port = process.env.PORT || 3012;
  await app.listen(port);
  Logger.log(`Payment Service HTTP running on: http://localhost:${port}`);
}

bootstrap();
