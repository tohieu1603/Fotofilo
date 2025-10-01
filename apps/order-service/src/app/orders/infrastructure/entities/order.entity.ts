import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderDetail } from './order-detail.entity';
import { ShippingAddress } from './shipping-address.entity';
import { BillingAddress } from './billing-address.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ShippingMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: string;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2 })
  taxAmount: string;

  @Column({ name: 'shipping_amount', type: 'decimal', precision: 10, scale: 2 })
  shippingAmount: string;

  @Column({ 
    name: 'discount_amount', 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: '0.00'
  })
  discountAmount: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: string;

  // Reference to payment-service
  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId?: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({
    name: 'shipping_method',
    type: 'enum',
    enum: ShippingMethod,
    default: ShippingMethod.STANDARD,
  })
  shippingMethod: ShippingMethod;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Address IDs referring to AddressService
  @Column({ name: 'shipping_address_id', type: 'uuid', nullable: true })
  shippingAddressId?: string;

  @Column({ name: 'billing_address_id', type: 'uuid', nullable: true })
  billingAddressId?: string;

  @OneToMany(() => OrderDetail, (detail) => detail.order, {
    cascade: true,
    eager: true,
  })
  orderDetails: OrderDetail[];

  @OneToMany(() => ShippingAddress, (address) => address.order, {
    cascade: true,
  })
  shippingAddresses: ShippingAddress[];

  @OneToMany(() => BillingAddress, (address) => address.order, {
    cascade: true,
  })
  billingAddresses: BillingAddress[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
