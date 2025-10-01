import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { resolveProtoPaths } from '@nestcm/proto';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:50051',
      package: ['product', 'brand', 'category'],
      protoPath: resolveProtoPaths([
        'proto/product.proto',
        'proto/brand.proto',
        'proto/category.proto',
      ]),
    },
  });

  // Apply global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // loại bỏ field thừa
      forbidNonWhitelisted: true, // báo lỗi nếu có field không khai báo
      transform: true, // auto transform kiểu dữ liệu
    }),
  );

  await app.startAllMicroservices();
  const port = 3001;
  await app.listen(port);
  Logger.log(
    `🚀 Product Service REST running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`🚀 Product Service gRPC running on: 0.0.0.0:50051`);
}
bootstrap();


