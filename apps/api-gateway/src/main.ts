import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GrpcClientExceptionFilter } from './app/common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  // Add global gRPC exception filter
  app.useGlobalFilters(new GrpcClientExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('E-commerce API') 
    .setDescription('API docs for E-commerce system') 
    .setVersion('1.0') 
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'Authorization',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Remove api prefix since it's now global

  await app.listen(3000);
  Logger.log(`🚀 Server is running on http://localhost:3000`);
  Logger.log(`📖 Swagger docs: http://localhost:3000/docs`);
}

bootstrap();
