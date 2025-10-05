import { Controller, Get, Post, Body, Param, Logger, UseGuards, Request, UseFilters } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { Order } from '@nestcm/proto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GrpcClientExceptionFilter } from '../common/filters/grpc-exception.filter';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(GrpcClientExceptionFilter)
@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    // Extract userId from JWT payload
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    if (!userId) {
      throw new Error('User ID not found in token');
    }

    this.logger.log(`🚀 [OrderController] Creating order for user: ${userId}`);

    // Convert DTO to gRPC request format
    const grpcRequest: Order.CreateOrderRequest = {
      items: createOrderDto.items.map(item => ({
        productId: item.productId,
        skuId: item.skuId,
        skuCode: item.skuCode,
        quantity: parseInt(item.quantity),
        unitPrice: {
          amount: item.unitPrice.amount,
          currency: item.unitPrice.currency,
        },
        discountAmount: item.discountAmount ? {
          amount: item.discountAmount.amount,
          currency: item.discountAmount.currency,
        } : undefined,
        totalAmount: {
          amount: item.totalAmount.amount,
          currency: item.totalAmount.currency,
        },
      })),
      shippingAddressId: createOrderDto.shippingAddressId,
      billingAddressId: createOrderDto.billingAddressId,
      shippingMethod: createOrderDto.shippingMethod,
      paymentMethod: createOrderDto.paymentMethod,
      notes: createOrderDto.notes,
      discountAmount: createOrderDto.discountAmount ? {
        amount: createOrderDto.discountAmount.amount,
        currency: createOrderDto.discountAmount.currency,
      } : undefined,
      currency: createOrderDto.currency,
    };

    const metadata = new Metadata();
    // Pass userId to gRPC service via metadata
    metadata.set('userId', userId);

    const response = await this.orderService.createOrder(grpcRequest, metadata);

    this.logger.log(`✅ [OrderController] Order created successfully: ${response.id}`);
    return response;
  }

  @Get('my-orders')
  async getMyOrders(@Request() req: any) {
    // Extract userId from JWT payload
    const userId = req.user?.sub || req.user?.userId || req.user?.id;

    if (!userId) {
      throw new Error('User ID not found in token');
    }

    this.logger.log(`🔍 [OrderController] Getting orders for user: ${userId}`);

    const metadata = new Metadata();
    // Pass userId to gRPC service via metadata
    metadata.set('userId', userId);

    const response = await this.orderService.getOrdersByCustomer(metadata);

    this.logger.log(`✅ [OrderController] Found ${response.orders?.length || 0} orders for user`);
    return response;
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    this.logger.log(`🔍 [OrderController] Getting order by ID: ${id}`);

    const metadata = new Metadata();
    const response = await this.orderService.getOrderById({
      orderId: id
    }, metadata);

    this.logger.log(`✅ [OrderController] Order found: ${response.orderNumber}`);
    return response;
  }

  @Get('number/:orderNumber')
  async getOrderByNumber(@Param('orderNumber') orderNumber: string) {
    this.logger.log(`🔍 [OrderController] Getting order by number: ${orderNumber}`);

    const metadata = new Metadata();
    const response = await this.orderService.getOrderByNumber({
      orderNumber
    }, metadata);

    this.logger.log(`✅ [OrderController] Order found: ${response.id}`);
    return response;
  }
}