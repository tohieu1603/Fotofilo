/**
 * Payment Status Value Object
 * Defines valid payment statuses and business rules
 */
export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export class PaymentStatus {
  private readonly _value: PaymentStatusEnum;
  
  constructor(value: PaymentStatusEnum) {
    this._value = value;
    this.validate();
  }

  private validate(): void {
    if (!Object.values(PaymentStatusEnum).includes(this._value)) {
      throw new Error(`Invalid payment status: ${this._value}`);
    }
  }

  get value(): PaymentStatusEnum {
    return this._value;
  }

  getValue(): PaymentStatusEnum {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: PaymentStatus): boolean {
    return this._value === other._value;
  }

  isPending(): boolean {
    return this._value === PaymentStatusEnum.PENDING;
  }

  isPaid(): boolean {
    return this._value === PaymentStatusEnum.PAID;
  }

  isFailed(): boolean {
    return this._value === PaymentStatusEnum.FAILED;
  }

  isRefunded(): boolean {
    return this._value === PaymentStatusEnum.REFUNDED;
  }

  isPartiallyRefunded(): boolean {
    return this._value === PaymentStatusEnum.PARTIALLY_REFUNDED;
  }

  /**
   * Check if payment status transition is allowed
   */
  canTransitionTo(newStatus: PaymentStatus): boolean {
    const transitions = {
      [PaymentStatusEnum.PENDING]: [PaymentStatusEnum.PAID, PaymentStatusEnum.FAILED],
      [PaymentStatusEnum.PAID]: [PaymentStatusEnum.REFUNDED, PaymentStatusEnum.PARTIALLY_REFUNDED],
      [PaymentStatusEnum.FAILED]: [PaymentStatusEnum.PENDING], // Allow retry
      [PaymentStatusEnum.REFUNDED]: [], // Terminal state
      [PaymentStatusEnum.PARTIALLY_REFUNDED]: [PaymentStatusEnum.REFUNDED],
    };

    return transitions[this._value]?.includes(newStatus.getValue()) ?? false;
  }

  static pending(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PENDING);
  }

  static unpaid(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PENDING);
  }

  static paid(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PAID);
  }

  static failed(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.FAILED);
  }

  static refunded(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.REFUNDED);
  }

  static partiallyRefunded(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PARTIALLY_REFUNDED);
  }
}