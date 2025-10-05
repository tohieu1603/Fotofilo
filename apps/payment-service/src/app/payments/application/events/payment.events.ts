export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly paymentMethod: string,
  ) {}
}

export class PaymentSuccessEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly transactionId: string,
    public readonly amount: number,
  ) {}
}

export class PaymentFailedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly reason: string,
  ) {}
}

export class PaymentPendingEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly paymentUrl?: string,
  ) {}
}
