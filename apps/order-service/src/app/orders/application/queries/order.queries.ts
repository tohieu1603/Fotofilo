export class GetOrderByIdQuery {
  constructor(public readonly orderId: string) {}
}

export class GetOrderByNumberQuery {
  constructor(public readonly orderNumber: string) {}
}

export class ListOrdersByCustomerQuery {
  constructor(
    public readonly customerId: string,
    public readonly pageSize?: number,
    public readonly pageToken?: string,
    public readonly statusFilter?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  ) {}
}