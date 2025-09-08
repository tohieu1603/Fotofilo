import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from './product.entity';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];
}
