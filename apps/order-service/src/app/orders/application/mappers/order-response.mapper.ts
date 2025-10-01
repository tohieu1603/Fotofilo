import { Injectable } from '@nestjs/common';
import { Order } from '@nestcm/proto';
import { OrderDto } from '../dto/order.dto';

@Injectable()
export class OrderResponseMapper {
  toOrderResponse(orderDto: OrderDto): Order.OrderResponse {
    return {
      id: orderDto.id,
      customerId: orderDto.customerId,
      orderNumber: orderDto.orderNumber,
      status: this.mapStatus(orderDto.status),
      subtotal: {
        amount: orderDto.subtotal,
        currency: orderDto.currency,
      },
      taxAmount: {
        amount: orderDto.taxAmount,
        currency: orderDto.currency,
      },
      shippingAmount: {
        amount: orderDto.shippingAmount,
        currency: orderDto.currency,
      },
      discountAmount: {
        amount: orderDto.discountAmount,
        currency: orderDto.currency,
      },
      totalAmount: {
        amount: orderDto.totalAmount,
        currency: orderDto.currency,
      },
      paymentId: orderDto.paymentId,
      shippingMethod: this.mapShippingMethod(orderDto.shippingMethod),
      trackingNumber: orderDto.trackingNumber,
      shippingAddressId: orderDto.shippingAddressId || '',
      billingAddressId: orderDto.billingAddressId || '',
      orderDetails: orderDto.items.map(item => ({
        id: item.id || '',
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: {
          amount: item.unitPrice,
          currency: orderDto.currency,
        },
        discountAmount: {
          amount: item.discountAmount,
          currency: orderDto.currency,
        },
        totalAmount: {
          amount: item.totalAmount,
          currency: orderDto.currency,
        },
        productAttributes: this.convertToStringMap(item.productAttributes || {}),
      })),
      notes: orderDto.notes,
      createdAt: orderDto.createdAt.toISOString(),
      updatedAt: orderDto.updatedAt.toISOString(),
    };
  }

  private mapStatus(status: string): Order.OrderStatus {
    switch (status) {
      case 'PENDING':
        return Order.OrderStatus.ORDER_STATUS_PENDING;
      case 'PROCESSING':
        return Order.OrderStatus.ORDER_STATUS_PROCESSING;
      case 'SHIPPED':
        return Order.OrderStatus.ORDER_STATUS_SHIPPED;
      case 'DELIVERED':
        return Order.OrderStatus.ORDER_STATUS_DELIVERED;
      case 'CANCELLED':
        return Order.OrderStatus.ORDER_STATUS_CANCELLED;
      default:
        return Order.OrderStatus.ORDER_STATUS_UNSPECIFIED;
    }
  }

  private mapShippingMethod(method: string): Order.ShippingMethod {
    switch (method) {
      case 'STANDARD':
        return Order.ShippingMethod.SHIPPING_METHOD_STANDARD;
      case 'EXPRESS':
        return Order.ShippingMethod.SHIPPING_METHOD_EXPRESS;
      case 'OVERNIGHT':
        return Order.ShippingMethod.SHIPPING_METHOD_OVERNIGHT;
      default:
        return Order.ShippingMethod.SHIPPING_METHOD_UNSPECIFIED;
    }
  }

  private convertToStringMap(obj: Record<string, unknown>): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = String(value);
    }
    return result;
  }
}