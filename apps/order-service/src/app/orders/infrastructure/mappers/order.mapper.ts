import { Injectable } from '@nestjs/common';
import { Order as OrderEntity, OrderStatus, ShippingMethod } from '../entities/order.entity';
import { OrderDetail } from '../entities/order-detail.entity';
import { ShippingAddress } from '../entities/shipping-address.entity';
import { BillingAddress } from '../entities/billing-address.entity';
import {
  CreateOrderAddress,
  CreateOrderData,
  CreateOrderItem,
  OrderAddressDto,
  OrderDto,
  OrderItemDto,
} from '../../application/dto/order.dto';

@Injectable()
export class OrderMapper {
  toEntity(order: CreateOrderData | OrderDto): OrderEntity {
    const entity = new OrderEntity();

    if (this.hasId(order)) {
      entity.id = order.id;
    }

    entity.customerId = order.customerId;
    entity.orderNumber = order.orderNumber;
    entity.status = order.status as OrderStatus;
    entity.subtotal = this.formatDecimal(order.subtotal);
    entity.taxAmount = this.formatDecimal(order.taxAmount);
    entity.shippingAmount = this.formatDecimal(order.shippingAmount);
    entity.discountAmount = this.formatDecimal(order.discountAmount);
    entity.totalAmount = this.formatDecimal(order.totalAmount);
    entity.currency = order.currency;
    entity.shippingMethod = order.shippingMethod as ShippingMethod;
    entity.trackingNumber = order.trackingNumber;
    entity.notes = order.notes;
    entity.paymentId = order.paymentId;
    entity.shippingAddressId = order.shippingAddressId;
    entity.billingAddressId = order.billingAddressId;

    entity.orderDetails = order.items.map((item) => this.toOrderDetailEntity(entity, item));
    entity.shippingAddresses = order.shippingAddress
      ? [this.toShippingAddressEntity(entity, order.shippingAddress)]
      : [];
    entity.billingAddresses = order.billingAddress
      ? [this.toBillingAddressEntity(entity, order.billingAddress)]
      : [];

    return entity;
  }

  toDomain(entity: OrderEntity): OrderDto {
    return {
      id: entity.id,
      customerId: entity.customerId,
      orderNumber: entity.orderNumber,
      status: entity.status,
      subtotal: Number(entity.subtotal),
      taxAmount: Number(entity.taxAmount),
      shippingAmount: Number(entity.shippingAmount),
      discountAmount: Number(entity.discountAmount),
      totalAmount: Number(entity.totalAmount),
      currency: entity.currency,
      shippingMethod: entity.shippingMethod,
      trackingNumber: entity.trackingNumber ?? undefined,
      notes: entity.notes ?? undefined,
      paymentId: entity.paymentId ?? undefined,
      shippingAddressId: entity.shippingAddressId ?? undefined,
      billingAddressId: entity.billingAddressId ?? undefined,
      items: entity.orderDetails?.map((detail) => this.toOrderItemDto(detail)) ?? [],
      shippingAddress: this.toAddressDto(entity.shippingAddresses?.[0]),
      billingAddress: this.toAddressDto(entity.billingAddresses?.[0]),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private hasId(order: CreateOrderData | OrderDto): order is OrderDto {
    return 'id' in order && typeof order.id === 'string';
  }

  private toOrderDetailEntity(
    entity: OrderEntity,
    item: CreateOrderItem | OrderItemDto,
  ): OrderDetail {
    const detail = new OrderDetail();

    if (this.hasItemId(item)) {
      detail.id = item.id;
    }

    detail.order = entity;
    detail.productId = item.productId;
    detail.productName = item.productName;
    detail.productSku = item.productSku;
    detail.quantity = item.quantity;
    detail.unitPrice = this.formatDecimal(item.unitPrice);
    detail.discountAmount = this.formatDecimal(item.discountAmount);
    detail.totalAmount = this.formatDecimal(item.totalAmount);
    detail.productAttributes = item.productAttributes ?? undefined;

    if (this.hasAuditFields(item)) {
      detail.createdAt = item.createdAt;
      detail.updatedAt = item.updatedAt;
    }

    return detail;
  }

  private toShippingAddressEntity(
    entity: OrderEntity,
    address: CreateOrderAddress | OrderAddressDto,
  ): ShippingAddress {
    const shipping = new ShippingAddress();

    if (this.hasAddressId(address)) {
      shipping.id = address.id;
    }

    shipping.order = entity;
    shipping.fullName = address.fullName;
    shipping.addressLine1 = address.addressLine1;
    shipping.addressLine2 = address.addressLine2 ?? undefined;
    shipping.city = address.city;
    shipping.state = address.state ?? undefined;
    shipping.postalCode = address.postalCode ?? undefined;
    shipping.country = address.country;
    shipping.phoneNumber = address.phoneNumber ?? undefined;

    if (this.hasAuditFields(address)) {
      shipping.createdAt = address.createdAt;
      shipping.updatedAt = address.updatedAt;
    }

    return shipping;
  }

  private toBillingAddressEntity(
    entity: OrderEntity,
    address: CreateOrderAddress | OrderAddressDto,
  ): BillingAddress {
    const billing = new BillingAddress();

    if (this.hasAddressId(address)) {
      billing.id = address.id;
    }

    billing.order = entity;
    billing.fullName = address.fullName;
    billing.addressLine1 = address.addressLine1;
    billing.addressLine2 = address.addressLine2 ?? undefined;
    billing.city = address.city;
    billing.state = address.state ?? undefined;
    billing.postalCode = address.postalCode ?? undefined;
    billing.country = address.country;
    billing.phoneNumber = address.phoneNumber ?? undefined;

    if (this.hasAuditFields(address)) {
      billing.createdAt = address.createdAt;
      billing.updatedAt = address.updatedAt;
    }

    return billing;
  }

  private toOrderItemDto(detail: OrderDetail): OrderItemDto {
    return {
      id: detail.id,
      productId: detail.productId,
      productName: detail.productName,
      productSku: detail.productSku,
      quantity: detail.quantity,
      unitPrice: Number(detail.unitPrice),
      discountAmount: Number(detail.discountAmount),
      totalAmount: Number(detail.totalAmount),
      productAttributes: detail.productAttributes ?? undefined,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
    };
  }

  private toAddressDto(address?: ShippingAddress | BillingAddress): OrderAddressDto | undefined {
    if (!address) {
      return undefined;
    }

    return {
      id: address.id,
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? undefined,
      city: address.city,
      state: address.state ?? undefined,
      postalCode: address.postalCode ?? undefined,
      country: address.country,
      phoneNumber: address.phoneNumber ?? undefined,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }

  private hasItemId(item: CreateOrderItem | OrderItemDto): item is OrderItemDto {
    return 'id' in item && typeof item.id === 'string';
  }

  private hasAddressId(address: CreateOrderAddress | OrderAddressDto): address is OrderAddressDto {
    return 'id' in address && typeof address.id === 'string';
  }

  private hasAuditFields(
    value: CreateOrderItem | OrderItemDto | CreateOrderAddress | OrderAddressDto,
  ): value is (OrderItemDto | OrderAddressDto) {
    return 'createdAt' in value && 'updatedAt' in value;
  }

  private formatDecimal(value: number): string {
    return value.toFixed(2);
  }
}
