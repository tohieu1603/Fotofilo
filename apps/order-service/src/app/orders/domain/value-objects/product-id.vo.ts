import { ValueObject } from './base/value-object';
import { DomainError } from './base/domain-error';

interface ProductIdProps {
  value: string;
}

export class ProductId extends ValueObject<ProductIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: ProductIdProps) {
    super(props);
  }

  public static create(value: string): ProductId {
    if (!value) {
      throw new DomainError('Product ID cannot be empty');
    }

    if (value.length < 1 || value.length > 50) {
      throw new DomainError('Product ID must be between 1 and 50 characters');
    }

    return new ProductId({ value });
  }

  getValue(): string {
    return this.value;
  }
}