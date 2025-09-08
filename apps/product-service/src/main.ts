import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // gRPC config
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:50051',
      package: 'product',
      protoPath: join(__dirname, '../../../libs/proto/src/proto/product.proto'),
    },
  });

  await app.startAllMicroservices();
  const port = 3001;
  await app.listen(port);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // loại bỏ field thừa
      forbidNonWhitelisted: true, // báo lỗi nếu có field không khai báo
      transform: true, // auto transform kiểu dữ liệu
    }),
  );
  Logger.log(
    `🚀 Product Service REST running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`🚀 Product Service gRPC running on: 0.0.0.0:50051`);
}
bootstrap();
