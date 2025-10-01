import { v4 as uuidv4 } from 'uuid';

/**
 * Order ID Value Object
 * Ensures order ID is always valid UUID format
 */
export class OrderId {
  private readonly _value: string;
  
  constructor(value?: string) {
    this._value = value || uuidv4();
    this.validate();
  }

  private validate(): void {
    if (!this._value) {
      throw new Error('Order ID cannot be empty');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(this._value)) {
      throw new Error('Order ID must be a valid UUID');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: OrderId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}