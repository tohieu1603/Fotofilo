import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { StockLog } from './stock-log.entity';

@Entity('inventory_stock')
export class InventoryStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sku_id' })
  skuId: string;

  @Column({ name: 'sku_code', unique: true })
  @Index()
  skuCode: string;

  @Column({ default: 0 })
  stock: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => StockLog, (stockLog) => stockLog.inventoryStock)
  stockLogs: StockLog[];
}