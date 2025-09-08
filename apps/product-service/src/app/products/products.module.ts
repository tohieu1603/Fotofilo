import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Sku } from './entities/sku.entity';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { AttributeOption } from './entities/attribute-option.entity';
import { SkuAttributeOption } from './entities/sku-attribute-option.entity';
import { ProductsController } from './products.controller';
import { Attribute } from './entities/attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Sku,
      Brand,
      Category,
      AttributeOption,
      SkuAttributeOption,
      Attribute
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
