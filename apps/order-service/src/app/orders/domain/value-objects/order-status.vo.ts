/**
 * Order Status Value Object
 * Defines valid order statuses and business rules
 */
export enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export class OrderStatus {
  private readonly _value: OrderStatusEnum;
  
  constructor(value: OrderStatusEnum) {
    this._value = value;
    this.validate();
  }

  private validate(): void {
    if (!Object.values(OrderStatusEnum).includes(this._value)) {
      throw new Error(`Invalid order status: ${this._value}`);
    }
  }

  get value(): OrderStatusEnum {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: OrderStatus): boolean {
    return this._value === other._value;
  }

  isPending(): boolean {
    return this.value === OrderStatusEnum.PENDING;
  }

  isConfirmed(): boolean {
    return this.value === OrderStatusEnum.CONFIRMED;
  }

  isProcessing(): boolean {
    return this.value === OrderStatusEnum.PROCESSING;
  }

  isShipped(): boolean {
    return this.value === OrderStatusEnum.SHIPPED;
  }

  isDelivered(): boolean {
    return this.value === OrderStatusEnum.DELIVERED;
  }

  isCancelled(): boolean {
    return this.value === OrderStatusEnum.CANCELLED;
  }

  isReturned(): boolean {
    return this.value === OrderStatusEnum.RETURNED;
  }

  /**
   * Check if status transition is allowed
   */
  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions = {
      [OrderStatusEnum.PENDING]: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.CONFIRMED]: [OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.PROCESSING]: [OrderStatusEnum.SHIPPED, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.SHIPPED]: [OrderStatusEnum.DELIVERED, OrderStatusEnum.RETURNED],
      [OrderStatusEnum.DELIVERED]: [OrderStatusEnum.RETURNED],
      [OrderStatusEnum.CANCELLED]: [], // Terminal state
      [OrderStatusEnum.RETURNED]: [], // Terminal state
    };

    return transitions[this.value]?.includes(newStatus._value) ?? false;
  }

  static pending(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PENDING);
  }

  static confirmed(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CONFIRMED);
  }

  static processing(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PROCESSING);
  }

  static shipped(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.SHIPPED);
  }

  static delivered(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.DELIVERED);
  }

  static cancelled(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CANCELLED);
  }

  static returned(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.RETURNED);
  }
}