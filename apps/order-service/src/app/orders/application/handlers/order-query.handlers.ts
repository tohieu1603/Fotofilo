import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetOrderByIdQuery, GetOrderByNumberQuery, ListOrdersByCustomerQuery } from '../queries/order.queries';
import { TypeOrmOrderRepository } from '../../infrastructure/repositories/typeorm-order.repository';
import { OrderDto, OrderListResponseDto } from '../dto/order.dto';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdHandler implements IQueryHandler<GetOrderByIdQuery> {
  private readonly logger = new Logger(GetOrderByIdHandler.name);

  constructor(private readonly orderRepository: TypeOrmOrderRepository) {}

  async execute(query: GetOrderByIdQuery): Promise<OrderDto> {
    this.logger.log(`Getting order by ID: ${query.orderId}`);

    const order = await this.orderRepository.findById(query.orderId);
    if (!order) {
      throw new Error(`Order with ID ${query.orderId} not found`);
    }

    return order;
  }
}

@QueryHandler(GetOrderByNumberQuery)
export class GetOrderByNumberHandler implements IQueryHandler<GetOrderByNumberQuery> {
  private readonly logger = new Logger(GetOrderByNumberHandler.name);

  constructor(private readonly orderRepository: TypeOrmOrderRepository) {}

  async execute(query: GetOrderByNumberQuery): Promise<OrderDto> {
    this.logger.log(`Getting order by number: ${query.orderNumber}`);

    const order = await this.orderRepository.findByOrderNumber(query.orderNumber);
    if (!order) {
      throw new Error(`Order with number ${query.orderNumber} not found`);
    }

    return order;
  }
}

@QueryHandler(ListOrdersByCustomerQuery)
export class ListOrdersByCustomerHandler implements IQueryHandler<ListOrdersByCustomerQuery> {
  private readonly logger = new Logger(ListOrdersByCustomerHandler.name);

  constructor(private readonly orderRepository: TypeOrmOrderRepository) {}

  async execute(query: ListOrdersByCustomerQuery): Promise<OrderListResponseDto> {
    this.logger.log(`Getting orders for customer: ${query.customerId}`);

    const pageSize = query.pageSize || 10;
    const offset = query.pageToken ? parseInt(query.pageToken, 10) : 0;

    let orders = await this.orderRepository.findByCustomerId(
      query.customerId,
      pageSize + 1, // Get one extra to check if there are more pages
      offset,
    );

    if (query.statusFilter) {
      orders = orders.filter((order) => order.status === query.statusFilter);
    }

    // Check if there are more results for pagination
    const hasMore = orders.length > pageSize;
    const resultOrders = hasMore ? orders.slice(0, pageSize) : orders;
    const nextPageToken = hasMore ? String(offset + pageSize) : undefined;

    return {
      orders: resultOrders,
      nextPageToken,
      totalCount: resultOrders.length,
    };
  }
}