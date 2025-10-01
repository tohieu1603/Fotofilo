import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StockLogType } from '../enums/stock-log-type.enum';
import { InventoryStock } from './inventory-stock.entity';

@Entity('stock_log')
export class StockLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sku_id' })
  skuId: string;

  @Column({ name: 'sku_code' })
  @Index()
  skuCode: string;

  @Column({
    type: 'enum',
    enum: StockLogType,
  })
  @Index()
  type: StockLogType;

  @Column()
  stock: number;

  @Column({ name: 'before_quantity' })
  beforeQuantity: number;

  @Column({ name: 'after_quantity' })
  afterQuantity: number;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ name: 'import_source', nullable: true })
  importSource?: string; // Nguồn nhập hàng

  @Column({ name: 'import_batch', nullable: true })
  importBatch?: string; // Lô hàng nhập

  @Column({ name: 'supplier_name', nullable: true })
  supplierName?: string; // Tên nhà cung cấp

  @Column({ name: 'import_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  importPrice?: number; // Giá nhập

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => InventoryStock, (inventoryStock) => inventoryStock.stockLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sku_code', referencedColumnName: 'skuCode' })
  inventoryStock: InventoryStock;
}