import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';
import { SkuAttributeOption } from './sku-attribute-option.entity';

@Entity('skus')
export class Sku {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column({ unique: true })
  skuCode: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Product, (product) => product.skus)
  product: Product;

  @OneToMany(() => SkuAttributeOption, (skuOption) => skuOption.sku)
  skuOptions: SkuAttributeOption[];
}
