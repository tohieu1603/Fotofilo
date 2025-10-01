
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { resolveProtoPath } from '@nestcm/proto';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: ['auth', 'address'],
      protoPath: [
        resolveProtoPath('proto/auth.proto'),
        resolveProtoPath('proto/address.proto'),
      ],
      url: process.env.GRPC_URL || '0.0.0.0:50052',
    },
  });

  await app.listen();
  Logger.log('🚀 Auth Service gRPC server is running on: ' + (process.env.GRPC_URL || '0.0.0.0:50052'));
}

bootstrap();


