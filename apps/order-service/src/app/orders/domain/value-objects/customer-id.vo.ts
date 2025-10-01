import { ValueObject } from './base/value-object';
import { DomainError } from './base/domain-error';

interface CustomerIdProps {
  value: string;
}

export class CustomerId extends ValueObject<CustomerIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: CustomerIdProps) {
    super(props);
  }

  public static create(value: string): CustomerId {
    if (!value) {
      throw new DomainError('Customer ID cannot be empty');
    }

    if (value.length < 1 || value.length > 50) {
      throw new DomainError('Customer ID must be between 1 and 50 characters');
    }

    return new CustomerId({ value });
  }

  getValue(): string {
    return this.value;
  }
}