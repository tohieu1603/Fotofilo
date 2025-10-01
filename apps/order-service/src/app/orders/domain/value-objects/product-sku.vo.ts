import { ValueObject } from './base/value-object';
import { DomainError } from './base/domain-error';

interface ProductSkuProps {
  value: string;
}

export class ProductSku extends ValueObject<ProductSkuProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: ProductSkuProps) {
    super(props);
  }

  public static create(value: string): ProductSku {
    if (!value) {
      throw new DomainError('Product SKU cannot be empty');
    }

    if (value.length < 1 || value.length > 100) {
      throw new DomainError('Product SKU must be between 1 and 100 characters');
    }

    return new ProductSku({ value });
  }

  getValue(): string {
    return this.value;
  }
}