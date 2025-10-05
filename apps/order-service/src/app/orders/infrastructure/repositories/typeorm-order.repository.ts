import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { OrderMapper } from '../mappers/order.mapper';
import { CreateOrderData, OrderDto } from '../../application/dto/order.dto';

@Injectable()
export class TypeOrmOrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderMapper: OrderMapper,
  ) {}

  async save(order: CreateOrderData | OrderDto): Promise<OrderDto> {
    const orderEntity = this.orderMapper.toEntity(order);
    const savedEntity = await this.orderRepository.save(orderEntity);
    return this.orderMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<OrderDto | null> {
    const entity = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderDetails', 'shippingAddresses', 'billingAddresses'],
    });

    return entity ? this.orderMapper.toDomain(entity) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderDto | null> {
    const entity = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['orderDetails', 'shippingAddresses', 'billingAddresses'],
    });

    return entity ? this.orderMapper.toDomain(entity) : null;
  }

  async findByCustomerId(
    customerId: string,
    limit?: number,
    offset?: number,
  ): Promise<OrderDto[]> {
    const entities = await this.orderRepository.find({
      where: { customerId },
      relations: ['orderDetails', 'shippingAddresses', 'billingAddresses'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => this.orderMapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.orderRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.orderRepository.count({ where: { id } });
    return count > 0;
  }

  async updatePaymentUrl(orderId: string, paymentUrl: string): Promise<void> {
    await this.orderRepository.update(orderId, { paymentUrl });
  }
}