import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { ShippingAddress } from './entities/shipping-address.entity';
import { BillingAddress } from './entities/billing-address.entity';
import { TypeOrmOrderRepository } from './repositories/typeorm-order.repository';
import { OrderMapper } from './mappers/order.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderDetail,
      ShippingAddress,
      BillingAddress,
    ]),
  ],
  providers: [
    OrderMapper,
    TypeOrmOrderRepository,
  ],
  exports: [TypeOrmOrderRepository, OrderMapper, TypeOrmModule],
})
export class OrderInfrastructureModule {}