import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../auth/infrastructure/entities/user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  fullName: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;

  @Column()
  city: string;

  @Column()
  district: string;

  @Column()
  ward: string;

  @Column()
  streetAddress: string;

  @ManyToOne(() => UserEntity, (user) => user.addresses, { onDelete: 'CASCADE' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
