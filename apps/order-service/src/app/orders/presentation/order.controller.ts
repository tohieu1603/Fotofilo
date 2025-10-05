import { Controller, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Metadata } from '@grpc/grpc-js';
import { Order } from '@nestcm/proto';
import { AddressServiceClient } from '../infrastructure/clients/address-service.client';
import { OrderResponseMapper } from '../application/mappers/order-response.mapper';

import { CreateOrderCommand } from '../application/commands/create-order.command';
import {
  UpdateOrderStatusCommand,
  AddOrderTrackingCommand,
  CancelOrderCommand,
} from '../application/commands/order.commands';

import {
  GetOrderByIdQuery,
  GetOrderByNumberQuery,
  ListOrdersByCustomerQuery,
} from '../application/queries/order.queries';

@Controller()
@Order.OrderServiceControllerMethods()
export class OrderController implements Order.OrderServiceController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly addressService: AddressServiceClient,
    private readonly orderResponseMapper: OrderResponseMapper,
  ) { }

  async createOrder(request: Order.CreateOrderRequest, metadata?: Metadata): Promise<Order.OrderResponse> {
    const userIdMeta = metadata?.get('userId')?.[0];
    const customerId = userIdMeta ? String(userIdMeta) : null;

    if (!customerId) {
      throw new Error('User ID not found in metadata');
    }

    this.logger.log(`Creating order for customer: ${customerId}`);
    this.logger.log(`Shipping Address ID: ${request.shippingAddressId}`);
    this.logger.log(`Billing Address ID: ${request.billingAddressId}`);

    const items = request.items.map(item => ({
      productId: item.productId,
      productSku: item.skuCode || item.skuId,
      skuId: item.skuId,
      quantity: item.quantity,
      requestedPrice: item.unitPrice?.amount,
    }));

    const shippingMethodMap = {
      [Order.ShippingMethod.SHIPPING_METHOD_STANDARD]: 'STANDARD' as const,
      [Order.ShippingMethod.SHIPPING_METHOD_EXPRESS]: 'EXPRESS' as const,
      [Order.ShippingMethod.SHIPPING_METHOD_OVERNIGHT]: 'OVERNIGHT' as const,
    };

    let shippingAddress = undefined;
    let billingAddress = undefined;

    try {
      if (request.shippingAddressId) {
        const shippingAddressResponse = await this.addressService.getAddress(request.shippingAddressId);
        if (shippingAddressResponse.address) {
          shippingAddress = {
            fullName: `${customerId}-shipping`,
            addressLine1: `${shippingAddressResponse.address.ward}, ${shippingAddressResponse.address.district}`,
            addressLine2: '',
            city: shippingAddressResponse.address.city,
            state: '',
            postalCode: '',
            country: 'Vietnam',
            phoneNumber: '',
          };
        }
      }

      if (request.billingAddressId && request.billingAddressId !== request.shippingAddressId) {
        const billingAddressResponse = await this.addressService.getAddress(request.billingAddressId);
        if (billingAddressResponse.address) {
          billingAddress = {
            fullName: `${customerId}-billing`,
            addressLine1: `${billingAddressResponse.address.ward}, ${billingAddressResponse.address.district}`,
            addressLine2: '',
            city: billingAddressResponse.address.city,
            state: '',
            postalCode: '',
            country: 'Vietnam',
            phoneNumber: '',
          };
        }
      } else if (request.billingAddressId === request.shippingAddressId) {
        billingAddress = shippingAddress;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch address details: ${error.message}`);
      throw new Error(`Failed to fetch address details: ${error.message}`);
    }

    const paymentMethod = (request.paymentMethod?.toUpperCase() as 'COD' | 'MOMO' | 'VNPAY' | 'STRIPE') || 'COD';

    const command = new CreateOrderCommand(
      customerId,
      items,
      shippingAddress,
      billingAddress,
      shippingMethodMap[request.shippingMethod] || 'STANDARD',
      request.notes,
      request.currency,
      request.shippingAddressId,
      request.billingAddressId,
      paymentMethod,
    );

    const createResult = await this.commandBus.execute(command);

    if (!createResult.success) {
      throw new Error(`Failed to create order: ${createResult.errors?.join(', ')}`);
    }

    this.logger.log(`Order created successfully: ${createResult.orderId}`);
    if (createResult.paymentUrl) {
      this.logger.log(`Payment URL: ${createResult.paymentUrl}`);
    }

    const getOrderQuery = new GetOrderByIdQuery(createResult.orderId);
    const orderDto = await this.queryBus.execute(getOrderQuery);

    const response = this.orderResponseMapper.toOrderResponse(orderDto);

    // Add payment URL to response metadata
    if (createResult.paymentUrl) {
      (response as any).paymentUrl = createResult.paymentUrl;
    }

    return response;
  }

  async getOrderById(request: Order.GetOrderByIdRequest): Promise<Order.OrderResponse> {
    this.logger.log(`Getting order by ID: ${request.orderId}`);

    const query = new GetOrderByIdQuery(request.orderId);
    const orderDto = await this.queryBus.execute(query);

    this.logger.log(`Order found: ${orderDto.orderNumber}`);
    return this.orderResponseMapper.toOrderResponse(orderDto);
  }

  async getOrderByNumber(request: Order.GetOrderByNumberRequest): Promise<Order.OrderResponse> {
    this.logger.log(`Getting order by number: ${request.orderNumber}`);

    const query = new GetOrderByNumberQuery(request.orderNumber);
    const orderDto = await this.queryBus.execute(query);

    this.logger.log(`Order found: ${orderDto.id}`);
    return this.orderResponseMapper.toOrderResponse(orderDto);
  }

  async listOrdersByCustomer(request: Order.ListOrdersByCustomerRequest, metadata?: Metadata): Promise<Order.OrderListResponse> {
    const userIdMeta = metadata?.get('userId')?.[0];
    const customerId = userIdMeta ? String(userIdMeta) : null;

    if (!customerId) {
      throw new Error('User ID not found in metadata');
    }

    this.logger.log(`Getting orders for customer: ${customerId}`);

    const statusMap = {
      [Order.OrderStatus.ORDER_STATUS_PENDING]: 'PENDING' as const,
      [Order.OrderStatus.ORDER_STATUS_PROCESSING]: 'PROCESSING' as const,
      [Order.OrderStatus.ORDER_STATUS_SHIPPED]: 'SHIPPED' as const,
      [Order.OrderStatus.ORDER_STATUS_DELIVERED]: 'DELIVERED' as const,
      [Order.OrderStatus.ORDER_STATUS_CANCELLED]: 'CANCELLED' as const,
    };

    const query = new ListOrdersByCustomerQuery(
      customerId,
      request.pageSize,
      request.pageToken,
      request.statusFilter !== Order.OrderStatus.ORDER_STATUS_UNSPECIFIED
        ? statusMap[request.statusFilter]
        : undefined,
    );

    const result = await this.queryBus.execute(query);

    this.logger.log(`Found ${result.orders?.length || 0} orders for customer`);

    return {
      orders: result.orders?.map(order => this.orderResponseMapper.toOrderResponse(order)) || [],
      nextPageToken: result.nextPageToken || "",
      totalCount: result.totalCount || 0,
    };
  }

  async updateOrderStatus(request: Order.UpdateOrderStatusRequest): Promise<Order.OrderResponse> {
    this.logger.log(`Updating order status: ${request.orderId} -> ${request.status}`);

    const statusMap = {
      [Order.OrderStatus.ORDER_STATUS_PENDING]: 'PENDING' as const,
      [Order.OrderStatus.ORDER_STATUS_PROCESSING]: 'PROCESSING' as const,
      [Order.OrderStatus.ORDER_STATUS_SHIPPED]: 'SHIPPED' as const,
      [Order.OrderStatus.ORDER_STATUS_DELIVERED]: 'DELIVERED' as const,
      [Order.OrderStatus.ORDER_STATUS_CANCELLED]: 'CANCELLED' as const,
    };

    const command = new UpdateOrderStatusCommand(
      request.orderId,
      statusMap[request.status] || 'PENDING',
      request.notes,
    );

    const orderDto = await this.commandBus.execute(command);
    this.logger.log(`Order status updated successfully`);

    return this.orderResponseMapper.toOrderResponse(orderDto);
  }

  async addOrderTracking(request: Order.AddOrderTrackingRequest): Promise<Order.OrderResponse> {
    this.logger.log(`Adding tracking to order: ${request.orderId}`);

    const command = new AddOrderTrackingCommand(
      request.orderId,
      request.trackingNumber,
      request.carrier,
    );

    const orderDto = await this.commandBus.execute(command);
    this.logger.log(`Tracking added successfully`);

    return this.orderResponseMapper.toOrderResponse(orderDto);
  }

  async cancelOrder(request: Order.CancelOrderRequest): Promise<Order.OrderResponse> {
    this.logger.log(`Cancelling order: ${request.orderId}`);

    const command = new CancelOrderCommand(
      request.orderId,
      request.reason,
    );

    const orderDto = await this.commandBus.execute(command);
    this.logger.log(`Order cancelled successfully`);

    return this.orderResponseMapper.toOrderResponse(orderDto);
  }
}