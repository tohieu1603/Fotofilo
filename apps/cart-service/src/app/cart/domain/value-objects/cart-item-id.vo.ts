import { v4 as uuidv4 } from 'uuid';

export class CartItemId {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value ?? uuidv4();
  }

  public getValue(): string {
    return this.value;
  }
}