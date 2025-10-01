export type OrderStatusValue = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type ShippingMethodValue = 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';

export interface OrderAddressDto {
  id?: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phoneNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemDto {
  id?: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
  productAttributes?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderDto {
  id: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatusValue;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingMethod: ShippingMethodValue;
  trackingNumber?: string;
  notes?: string;
  paymentId?: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  items: OrderItemDto[];
  shippingAddress?: OrderAddressDto;
  billingAddress?: OrderAddressDto;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateOrderItem = Omit<OrderItemDto, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateOrderAddress = Omit<OrderAddressDto, 'id' | 'createdAt' | 'updatedAt'>;

export interface CreateOrderData {
  customerId: string;
  orderNumber: string;
  status: OrderStatusValue;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingMethod: ShippingMethodValue;
  trackingNumber?: string;
  notes?: string;
  paymentId?: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  items: CreateOrderItem[];
  shippingAddress: CreateOrderAddress;
  billingAddress?: CreateOrderAddress;
}

export interface OrderListResponseDto {
  orders: OrderDto[];
  nextPageToken?: string;
  totalCount?: number;
}