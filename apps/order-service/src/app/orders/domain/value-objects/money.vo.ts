/**
 * Money Value Object
 * Handles monetary values with proper validation and operations
 */
export class Money {
  constructor(private readonly amount: number, private readonly currency = 'VND') {
    this.validate();
  }

  private validate(): void {
    if (typeof this.amount !== 'number' || isNaN(this.amount)) {
      throw new Error('Amount must be a valid number');
    }

    if (this.amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    if (!this.currency || this.currency.trim().length === 0) {
      throw new Error('Currency cannot be empty');
    }

    // Validate currency code (basic validation for common currencies)
    const validCurrencies = ['VND', 'USD', 'EUR', 'JPY', 'GBP'];
    if (!validCurrencies.includes(this.currency.toUpperCase())) {
      throw new Error(`Unsupported currency: ${this.currency}`);
    }
  }

  static zero(currency = 'VND'): Money {
    return new Money(0, currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency.toUpperCase();
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Result cannot be negative');
    }
    return new Money(result, this.currency);
  }

  multiply(multiplier: number): Money {
    if (typeof multiplier !== 'number' || isNaN(multiplier) || multiplier < 0) {
      throw new Error('Multiplier must be a non-negative number');
    }
    return new Money(this.amount * multiplier, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.amount < other.amount;
  }

  toString(): string {
    return `${this.amount.toLocaleString()} ${this.currency}`;
  }

  /**
   * Format money for display
   */
  format(): string {
    if (this.currency === 'VND') {
      return `${this.amount.toLocaleString('vi-VN')} ₫`;
    }
    return `${this.currency} ${this.amount.toLocaleString()}`;
  }

  static fromVND(amount: number): Money {
    return new Money(amount, 'VND');
  }
}