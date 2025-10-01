export class UpdateOrderStatusCommand {
  constructor(
    public readonly orderId: string,
    public readonly status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
    public readonly notes?: string,
  ) {}
}

export class AddOrderTrackingCommand {
  constructor(
    public readonly orderId: string,
    public readonly trackingNumber: string,
    public readonly carrier?: string,
  ) {}
}

export class CancelOrderCommand {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
  ) {}
}