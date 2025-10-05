export interface OrderItemCommand {
  productId: string;
  productSku: string;
  skuId?: string;
  quantity: number;
  requestedPrice?: number;
}

export interface AddressCommand {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phoneNumber?: string;
}

export class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItemCommand[],
    public readonly shippingAddress: AddressCommand,
    public readonly billingAddress?: AddressCommand,
    public readonly shippingMethod?: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT',
    public readonly notes?: string,
    public readonly currency?: string,
    public readonly shippingAddressId?: string,
    public readonly billingAddressId?: string,
    public readonly paymentMethod?: 'COD' | 'MOMO' | 'VNPAY' | 'STRIPE',
  ) {}
}