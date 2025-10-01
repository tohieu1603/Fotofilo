import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CartEntity } from './cart-entity';

@Entity('cart_items')
export class CartItemEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    cartId: string;

    @Column()
    skuId: string;

    @Column()
    productId: string;

    @Column({ length: 255 })
    skuCode: string;

    @Column('int')
    quantity: number;

    @Column('decimal', {
        precision: 10, scale: 2, transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        }
    })
    price: number;

    @Column('varchar', { length: 255, nullable: true })
    image?: string;

    @Column({ type: 'jsonb', nullable: true })
    itemDetail?: unknown;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date;

    @ManyToOne(() => CartEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cartId' })
    cart: CartEntity;
}
