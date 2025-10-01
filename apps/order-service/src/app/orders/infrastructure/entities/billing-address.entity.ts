import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('billing_addresses')
export class BillingAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'address_line_1' })
  addressLine1: string;

  @Column({ name: 'address_line_2', nullable: true })
  addressLine2?: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode?: string;

  @Column()
  country: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @ManyToOne(() => Order, (order) => order.billingAddresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}