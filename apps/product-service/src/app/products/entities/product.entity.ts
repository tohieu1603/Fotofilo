import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Brand } from './brand.entity';
import { CategoryEntity } from '../../categories/infrastructure/entities/category.entity';
import { Sku } from './sku.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  brandId?: string;

  @Column({ nullable: true })
  categoryId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Brand, (brand) => brand.products)
  brand?: Brand;

  @ManyToOne(() => CategoryEntity, (category) => category.products)
  category?: CategoryEntity;

  @OneToMany(() => Sku, (sku) => sku.product)
  skus: Sku[];
}
