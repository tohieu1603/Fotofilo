import { v4 as uuidv4 } from 'uuid';

/**
 * Order Detail ID Value Object
 * Ensures order detail ID is always valid UUID format
 */
export class OrderDetailId {
  constructor(private readonly value?: string) {
    this.value = value || uuidv4();
    this.validate();
  }

  private validate(): void {
    if (!this.value) {
      throw new Error('Order Detail ID cannot be empty');
    }
    
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(this.value)) {
      throw new Error('Order Detail ID must be a valid UUID');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrderDetailId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}