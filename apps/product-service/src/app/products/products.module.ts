import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Sku } from './entities/sku.entity';
import { Brand } from './entities/brand.entity';
import { CategoryEntity } from '../categories';
import { AttributeOption } from './entities/attribute-option.entity';
import { SkuAttributeOption } from './entities/sku-attribute-option.entity';
import { ProductsGrpcController } from './products.controller';
import { Attribute } from './entities/attribute.entity';
import { CommonModule } from '@nestcm/common';
import { KafkaService } from '../shared/kafka/kafka.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Sku,
      Brand,
      CategoryEntity,
      AttributeOption,
      SkuAttributeOption,
      Attribute
    ]),
    CommonModule,
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'product-service',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
          consumer: {
            groupId: 'product-consumer-group',
          },
        },
      },
    ]),
  ],
  controllers: [ProductsGrpcController],
  providers: [ProductsService, KafkaService],
  exports: [ProductsService],
})
export class ProductsModule {}
