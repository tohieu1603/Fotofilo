import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { resolveProtoPath } from '@nestcm/proto';

async function bootstrap() {
  try {
    Logger.log('🚀 Starting Cart Service...');
    
    const app = await NestFactory.create(AppModule);
    Logger.log('✅ NestJS app created successfully');

    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:50053',
        package: 'cart', 
        protoPath: resolveProtoPath('proto/cart.proto'),
        loader: { keepCase: true },
      },
    });
    Logger.log('📡 gRPC microservice configured');

    await app.startAllMicroservices();
    Logger.log('🎯 Microservices started');

    const port = 3002;
    await app.listen(port);
    Logger.log(`🚀 Cart Service REST: http://localhost:${port}/${globalPrefix}`);
    Logger.log(`🔗 Cart Service gRPC: 0.0.0.0:50053`);
    
  } catch (error) {
    Logger.error('❌ Failed to start Cart Service:', error);
    process.exit(1);
  }
}

bootstrap().catch(error => {
  Logger.error('💥 Bootstrap failed:', error);
  process.exit(1);
});