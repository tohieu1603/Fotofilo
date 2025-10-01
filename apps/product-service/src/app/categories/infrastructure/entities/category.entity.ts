import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Product } from '../../../products/entities/product.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  image?: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne(() => CategoryEntity, category => category.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: CategoryEntity;

  @OneToMany(() => CategoryEntity, category => category.parent)
  children?: CategoryEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
  
  @OneToMany(() => Product, (product) => product.category)
  products?: Product[];
  
}
