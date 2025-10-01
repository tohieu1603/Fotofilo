import { ValueObject } from './base/value-object';
import { DomainError } from './base/domain-error';

interface OrderNumberProps {
  value: string;
}

export class OrderNumber extends ValueObject<OrderNumberProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: OrderNumberProps) {
    super(props);
  }

  public static create(value: string): OrderNumber {
    if (!value) {
      throw new DomainError('Order number cannot be empty');
    }

    if (value.length < 1 || value.length > 50) {
      throw new DomainError('Order number must be between 1 and 50 characters');
    }

    return new OrderNumber({ value });
  }

  getValue(): string {
    return this.value;
  }
}