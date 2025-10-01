
import { OrderDetailId, Money, ProductDetail } from '../value-objects';

/**
 * Order Detail Domain Entity
 * Represents a single item within an order
 */
export class OrderDetail {
  constructor(
    public readonly id: OrderDetailId,
    public readonly orderId: string,
    public readonly skuId: string,
    public readonly quantity: number,
    public readonly unitPrice: Money,
    public readonly productDetail: ProductDetail,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.orderId || this.orderId.trim().length === 0) {
      throw new Error('Order ID cannot be empty');
    }

    if (!this.skuId || this.skuId.trim().length === 0) {
      throw new Error('SKU ID cannot be empty');
    }

    if (!Number.isInteger(this.quantity) || this.quantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }

    if (this.quantity > 1000) {
      throw new Error('Quantity cannot exceed 1000');
    }

    if (!this.unitPrice || this.unitPrice.isZero()) {
      throw new Error('Unit price must be greater than zero');
    }
  }

  /**
   * Create new OrderDetail
   */
  static create(
    orderId: string,
    skuId: string,
    quantity: number,
    unitPrice: Money,
    productDetail: ProductDetail,
    id?: string,
  ): OrderDetail {
    return new OrderDetail(
      new OrderDetailId(id),
      orderId,
      skuId,
      quantity,
      unitPrice,
      productDetail,
      new Date(),
      new Date(),
    );
  }

  /**
   * Create from existing data
   */
  static fromExisting(params: {
    id: string;
    orderId: string;
    skuId: string;
    quantity: number;
    unitPrice: Money;
    productDetail: ProductDetail;
    createdAt?: Date;
    updatedAt?: Date;
  }): OrderDetail {
    return new OrderDetail(
      new OrderDetailId(params.id),
      params.orderId,
      params.skuId,
      params.quantity,
      params.unitPrice,
      params.productDetail,
      params.createdAt ?? new Date(),
      params.updatedAt ?? new Date(),
    );
  }

  /**
   * Update quantity
   */
  updateQuantity(newQuantity: number): OrderDetail {
    if (!Number.isInteger(newQuantity) || newQuantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }

    if (newQuantity > 1000) {
      throw new Error('Quantity cannot exceed 1000');
    }

    return new OrderDetail(
      this.id,
      this.orderId,
      this.skuId,
      newQuantity,
      this.unitPrice,
      this.productDetail,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update unit price
   */
  updateUnitPrice(newUnitPrice: Money): OrderDetail {
    if (!newUnitPrice || newUnitPrice.isZero()) {
      throw new Error('Unit price must be greater than zero');
    }

    return new OrderDetail(
      this.id,
      this.orderId,
      this.skuId,
      this.quantity,
      newUnitPrice,
      this.productDetail,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Calculate total price for this order detail
   */
  getTotalPrice(): Money {
    return this.unitPrice.multiply(this.quantity);
  }

  /**
   * Check if this order detail matches the given SKU
   */
  matchesSku(skuId: string): boolean {
    return this.skuId === skuId;
  }

  /**
   * Get product name from product detail
   */
  getProductName(): string {
    return this.productDetail.getName();
  }

  /**
   * Check equality with another OrderDetail
   */
  equals(other: OrderDetail): boolean {
    return this.id.equals(other.id);
  }
}