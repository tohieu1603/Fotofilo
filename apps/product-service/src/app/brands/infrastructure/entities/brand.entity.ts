import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "../../../products/entities/product.entity";


@Entity('brands')
export class BrandEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    name: string;

    @Column({ type: 'boolean', default: true })
    active: boolean;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
    createdAt: Date;
    @CreateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
    updatedAt: Date;
    @Column({ type: 'timestamp with time zone', name: 'deleted_at', nullable: true })
    deletedAt?: Date;

    @OneToMany(() => Product, (product) => product.brand)
    products: Product[];
}