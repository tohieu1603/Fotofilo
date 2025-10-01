import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CategoryModule } from './categories/category.module';
import { CategoryEntity } from './categories/infrastructure/entities/category.entity';
import { BrandEntity } from './brands/infrastructure/entities/brand.entity';
import { Product } from './products/entities/product.entity';
import { Sku } from './products/entities/sku.entity';
import { Brand } from './products/entities/brand.entity';
import { Attribute } from './products/entities/attribute.entity';
import { AttributeOption } from './products/entities/attribute-option.entity';
import { SkuAttributeOption } from './products/entities/sku-attribute-option.entity';
import { BrandModule } from './brands/brand.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env['localhost'] || 'localhost',
      port: parseInt(process.env['5432'] || '5432'),
      username: process.env['postgres'] || 'postgres',
      password: process.env['123456789'] || '123456789',
      database: process.env['product_db1'] || 'product_dbb',
      entities: [
        CategoryEntity,
        BrandEntity,
        Product,  
        Sku,
        Brand,
        Attribute,
        AttributeOption,
        SkuAttributeOption,
      ],
      synchronize: false, 
      dropSchema: false,  
      logging: process.env['NODE_ENV'] === 'development',
      ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
    }),
    ProductsModule,
    CategoryModule,
    BrandModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
