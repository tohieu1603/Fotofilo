import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { resolveProtoPaths } from '@nestcm/proto';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:50054',
      package: ['order'],
      protoPath: resolveProtoPaths([
        'proto/order.proto',
      ]),
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();
  const port = 3005;
  await app.listen(port);
  Logger.log(
    `Order Service REST running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log('Order Service gRPC running on: 0.0.0.0:50054');
}

bootstrap();
