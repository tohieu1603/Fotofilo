import {
  OrderId,
  OrderDetailId,
  OrderStatus,
  PaymentStatus,
  Money,
  ShippingAddress,
} from '../value-objects';
import { OrderDetail } from './order-detail.entity';

/**
 * Order Domain Entity (Aggregate Root)
 * Manages order lifecycle and business rules
 */
export class Order {
  private readonly _orderDetails: OrderDetail[] = [];

  constructor(
    public readonly id: OrderId,
    public readonly userId: string,
    public readonly code: string,
    private readonly _status: OrderStatus,
    private readonly _totalAmount: Money,
    private readonly _paymentStatus: PaymentStatus,
    private readonly _shippingFee: Money,
    public readonly receiverPhone: string,
    private readonly _shippingAddress: ShippingAddress,
    public readonly receiverName: string,
    orderDetails: OrderDetail[] = [],
    public readonly discount?: string,
    public readonly note?: string,
    public readonly createdAt: Date = new Date(),
    private readonly _updatedAt: Date = new Date(),
  ) {
    this._orderDetails = [...orderDetails];
    this.validate();
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!this.code || this.code.trim().length === 0) {
      throw new Error('Order code cannot be empty');
    }

    if (!this.receiverName || this.receiverName.trim().length === 0) {
      throw new Error('Receiver name cannot be empty');
    }

    if (!this.receiverPhone || this.receiverPhone.trim().length === 0) {
      throw new Error('Receiver phone cannot be empty');
    }

    if (!this._totalAmount || this._totalAmount.getAmount() < 0) {
      throw new Error('Total amount cannot be negative');
    }

    if (!this._shippingFee || this._shippingFee.getAmount() < 0) {
      throw new Error('Shipping fee cannot be negative');
    }

    if (this._orderDetails.length === 0) {
      throw new Error('Order must have at least one order detail');
    }
  }

  // Getters
  get status(): OrderStatus {
    return this._status;
  }

  get paymentStatus(): PaymentStatus {
    return this._paymentStatus;
  }

  get totalAmount(): Money {
    return this._totalAmount;
  }

  get shippingFee(): Money {
    return this._shippingFee;
  }

  get shippingAddress(): ShippingAddress {
    return this._shippingAddress;
  }

  get orderDetails(): readonly OrderDetail[] {
    return [...this._orderDetails];
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Create new Order with required parameters
   */
  static create(params: {
    userId: string;
    code: string;
    shippingAddress: ShippingAddress;
    receiverName: string;
    receiverPhone: string;
    orderDetails: OrderDetail[];
    shippingFee: Money;
    discount?: string;
    note?: string;
    id?: string;
  }): Order {
    if (!params.orderDetails || params.orderDetails.length === 0) {
      throw new Error('Order must have at least one order detail');
    }

    const subtotal = params.orderDetails.reduce(
      (total, detail) => total.add(detail.getTotalPrice()),
      new Money(0, params.shippingFee.getCurrency()),
    );

    const totalAmount = subtotal.add(params.shippingFee);

    return new Order(
      new OrderId(params.id),
      params.userId,
      params.code,
      OrderStatus.pending(),
      totalAmount,
      PaymentStatus.unpaid(),
      params.shippingFee,
      params.receiverPhone,
      params.shippingAddress,
      params.receiverName,
      params.orderDetails,
      params.discount,
      params.note,
      new Date(),
      new Date(),
    );
  }

  /**
   * Create from existing data
   */
  static fromExisting(params: {
    id: string;
    userId: string;
    code: string;
    status: string;
    totalAmount: Money;
    paymentStatus: string;
    shippingFee: Money;
    receiverPhone: string;
    shippingAddress: ShippingAddress;
    receiverName: string;
    orderDetails: OrderDetail[];
    discount?: string;
    note?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Order {
    // For now, create with pending status and let business logic handle transitions
    const orderStatus = OrderStatus.pending(); 
    const paymentStatus = PaymentStatus.unpaid();
    
    return new Order(
      new OrderId(params.id),
      params.userId,
      params.code,
      orderStatus,
      params.totalAmount,
      paymentStatus,
      params.shippingFee,
      params.receiverPhone,
      params.shippingAddress,
      params.receiverName,
      params.orderDetails,
      params.discount,
      params.note,
      params.createdAt ?? new Date(),
      params.updatedAt ?? new Date(),
    );
  }

  /**
   * Add order detail
   */
  addOrderDetail(orderDetail: OrderDetail): Order {
    if (!this._status.equals(OrderStatus.pending())) {
      throw new Error('Cannot add order details to non-pending orders');
    }

    // Check if SKU already exists
    const existingDetail = this._orderDetails.find(detail => 
      detail.matchesSku(orderDetail.skuId)
    );

    if (existingDetail) {
      throw new Error(`Order detail for SKU ${orderDetail.skuId} already exists`);
    }

    const newOrderDetails = [...this._orderDetails, orderDetail];
    const newSubtotal = this.calculateSubtotalFromDetails(newOrderDetails);
    const newTotalAmount = newSubtotal.add(this._shippingFee);

    return new Order(
      this.id,
      this.userId,
      this.code,
      this._status,
      newTotalAmount,
      this._paymentStatus,
      this._shippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      newOrderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Remove order detail
   */
  removeOrderDetail(orderDetailId: string): Order {
    if (!this._status.equals(OrderStatus.pending())) {
      throw new Error('Cannot remove order details from non-pending orders');
    }

    const newOrderDetails = this._orderDetails.filter(
      detail => !detail.id.equals(new OrderDetailId(orderDetailId))
    );

    if (newOrderDetails.length === this._orderDetails.length) {
      throw new Error('Order detail not found');
    }

    if (newOrderDetails.length === 0) {
      throw new Error('Cannot remove last order detail');
    }

    const newSubtotal = this.calculateSubtotalFromDetails(newOrderDetails);
    const newTotalAmount = newSubtotal.add(this._shippingFee);

    return new Order(
      this.id,
      this.userId,
      this.code,
      this._status,
      newTotalAmount,
      this._paymentStatus,
      this._shippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      newOrderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update order detail quantity
   */
  updateOrderDetailQuantity(orderDetailId: string, newQuantity: number): Order {
    if (!this._status.equals(OrderStatus.pending())) {
      throw new Error('Cannot update order details in non-pending orders');
    }

    const updatedOrderDetails = this._orderDetails.map(detail => {
      if (detail.id.equals(new OrderDetailId(orderDetailId))) {
        return detail.updateQuantity(newQuantity);
      }
      return detail;
    });

    const newSubtotal = this.calculateSubtotalFromDetails(updatedOrderDetails);
    const newTotalAmount = newSubtotal.add(this._shippingFee);

    return new Order(
      this.id,
      this.userId,
      this.code,
      this._status,
      newTotalAmount,
      this._paymentStatus,
      this._shippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      updatedOrderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Confirm order
   */
  confirm(): Order {
    if (!this._status.equals(OrderStatus.pending())) {
      throw new Error('Only pending orders can be confirmed');
    }

    return new Order(
      this.id,
      this.userId,
      this.code,
      OrderStatus.confirmed(),
      this._totalAmount,
      this._paymentStatus,
      this._shippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      this._orderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Ship order
   */
  ship(): Order {
    if (!this._status.equals(OrderStatus.confirmed())) {
      throw new Error('Only confirmed orders can be shipped');
    }

    if (!this._paymentStatus.equals(PaymentStatus.paid())) {
      throw new Error('Cannot ship unpaid orders');
    }

    return new Order(
      this.id,
      this.userId,
      this.code,
      OrderStatus.shipped(),
      this._totalAmount,
      this._paymentStatus,
      this._shippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      this._orderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Deliver order
   */
  deliver(): Order {
    if (!this._status.equals(OrderStatus.shipped())) {
      throw new Error('Only shipped orders can be delivered');
    }

    return new Order(
      this.id,
      this.userId,
      this.code,
      OrderStatus.delivered(),
      this._totalAmount,
      this._paymentStatus,
      this._shippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      this._orderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Cancel order
   */
  cancel(): Order {
    if (this._status.equals(OrderStatus.delivered())) {
      throw new Error('Cannot cancel delivered orders');
    }

    if (this._status.equals(OrderStatus.cancelled())) {
      throw new Error('Order is already cancelled');
    }

    return new Order(
      this.id,
      this.userId,
      this.code,
      OrderStatus.cancelled(),
      this._totalAmount,
      this._paymentStatus,
      this._shippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      this._orderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Mark payment as paid
   */
  markAsPaid(): Order {
    if (this._paymentStatus.equals(PaymentStatus.paid())) {
      throw new Error('Order is already paid');
    }

    if (this._status.equals(OrderStatus.cancelled())) {
      throw new Error('Cannot mark cancelled orders as paid');
    }

    return new Order(
      this.id,
      this.userId,
      this.code,
      this._status,
      this._totalAmount,
      PaymentStatus.paid(),
      this._shippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      this._orderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Mark payment as failed
   */
  markPaymentAsFailed(): Order {
    if (this._paymentStatus.equals(PaymentStatus.failed())) {
      throw new Error('Payment is already marked as failed');
    }

    return new Order(
      this.id,
      this.userId,
      this.code,
      this._status,
      this._totalAmount,
      PaymentStatus.failed(),
      this._shippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      this._orderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update shipping address
   */
  updateShippingAddress(newShippingAddress: ShippingAddress): Order {
    if (!this._status.equals(OrderStatus.pending()) && !this._status.equals(OrderStatus.confirmed())) {
      throw new Error('Cannot update shipping address for orders that are already shipped');
    }

    return new Order(
      this.id,
      this.userId,
      this.code,
      this._status,
      this._totalAmount,
      this._paymentStatus,
      this._shippingFee,
      this.receiverPhone,
      newShippingAddress,
      this.receiverName,
      this._orderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update shipping fee
   */
  updateShippingFee(newShippingFee: Money): Order {
    if (!this._status.equals(OrderStatus.pending())) {
      throw new Error('Cannot update shipping fee for non-pending orders');
    }

    const subtotal = this.calculateSubtotal();
    const newTotalAmount = subtotal.add(newShippingFee);

    return new Order(
      this.id,
      this.userId,
      this.code,
      this._status,
      newTotalAmount,
      this._paymentStatus,
      newShippingFee,
      this.receiverPhone,
      this._shippingAddress,
      this.receiverName,
      this._orderDetails,
      this.discount,
      this.note,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Calculate subtotal (excluding shipping fee)
   */ 
  calculateSubtotal(): Money {
    return this.calculateSubtotalFromDetails(this._orderDetails);
  }

  private calculateSubtotalFromDetails(orderDetails: OrderDetail[]): Money {
    if (orderDetails.length === 0) {
      return new Money(0, this._shippingFee.getCurrency());
    }

    return orderDetails.reduce(
      (total, detail) => total.add(detail.getTotalPrice()),
      new Money(0, orderDetails[0].unitPrice.getCurrency()),
    );
  }

  /**
   * Get order summary
   */
  getSummary(): {
    orderId: string;
    userId: string;
    code: string;
    status: string;
    paymentStatus: string;
    totalAmount: string;
    subtotal: string;
    shippingFee: string;
    itemCount: number;
    receiverName: string;
    receiverPhone: string;
    createdAt: Date;
  } {
    return {
      orderId: this.id.toString(), // Use toString() instead of .value
      userId: this.userId,
      code: this.code,
      status: this._status.toString(), // Use toString() instead of .value
      paymentStatus: this._paymentStatus.toString(), // Use toString() instead of .value
      totalAmount: this._totalAmount.toString(),
      subtotal: this.calculateSubtotal().toString(),
      shippingFee: this._shippingFee.toString(),
      itemCount: this._orderDetails.length,
      receiverName: this.receiverName,
      receiverPhone: this.receiverPhone,
      createdAt: this.createdAt,
    };
  }

  /**
   * Check if order can be modified
   */
  canBeModified(): boolean {
    return this._status.equals(OrderStatus.pending());
  }

  /**
   * Check if order is in final state
   */
  isInFinalState(): boolean {
    return this._status.equals(OrderStatus.delivered()) || this._status.equals(OrderStatus.cancelled());
  }

  /**
   * Check equality with another Order
   */
  equals(other: Order): boolean {
    return this.id.equals(other.id);
  }
}