import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Order } from '@nestcm/proto';

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly logger = new Logger(OrderService.name);
  private orderService: Order.OrderServiceClient;

  constructor(
    @Inject(Order.ORDER_PACKAGE_NAME) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.orderService = this.client.getService<Order.OrderServiceClient>('OrderService');
  }

  async createOrder(createOrderDto: Order.CreateOrderRequest, metadata?: Metadata) {
    this.logger.log(`[OrderService] Creating order`);
    const grpcMetadata = metadata || new Metadata();
    return firstValueFrom(this.orderService.createOrder(createOrderDto, grpcMetadata));
  }

  async getOrdersByCustomer(metadata?: Metadata) {
    this.logger.log(`[OrderService] Getting orders for customer`);
    const grpcMetadata = metadata || new Metadata();
    return firstValueFrom(this.orderService.listOrdersByCustomer({
      pageSize: 10,
      pageToken: '',
      statusFilter: 0 // ORDER_STATUS_UNSPECIFIED
    }, grpcMetadata));
  }

  async getOrderById(request: Order.GetOrderByIdRequest, metadata?: Metadata) {
    this.logger.log(`[OrderService] Getting order by ID: ${request.orderId}`);
    const grpcMetadata = metadata || new Metadata();
    return firstValueFrom(this.orderService.getOrderById(request, grpcMetadata));
  }

  async getOrderByNumber(request: Order.GetOrderByNumberRequest, metadata?: Metadata) {
    this.logger.log(`[OrderService] Getting order by number: ${request.orderNumber}`);
    const grpcMetadata = metadata || new Metadata();
    return firstValueFrom(this.orderService.getOrderByNumber(request, grpcMetadata));
  }
}