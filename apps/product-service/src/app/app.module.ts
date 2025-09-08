import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule, DatabaseService } from '@nestcm/database';
import { ProductsModule } from './products/products.module';
import { KafkaService } from './shared/kafka/kafka.service';
import { RedisService } from './shared/redis/redis.service';
import { Product } from './products/entities/product.entity';
import { Sku } from './products/entities/sku.entity';
import { Brand } from './products/entities/brand.entity';
import { Category } from './products/entities/category.entity';
import { AttributeOption } from './products/entities/attribute-option.entity';
import { SkuAttributeOption } from './products/entities/sku-attribute-option.entity';
import { Attribute } from './products/entities/attribute.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TypeOrmModule.forRootAsync({
      imports: [DatabaseModule],
      useFactory: (databaseService: DatabaseService) => {
        const config = databaseService.getServiceDatabaseConfig('product-service');
        return {
          type: 'postgres',
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: config.database,
          schema: config.schema,
          entities: [Product, Sku, Brand, Category, AttributeOption, SkuAttributeOption, Attribute],
          synchronize: process.env.NODE_ENV === 'development',
          logging: process.env.NODE_ENV === 'development',
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [DatabaseService],
    }),
    ProductsModule,
  ],
  controllers: [],
  providers: [DatabaseService],
})
export class AppModule {}
