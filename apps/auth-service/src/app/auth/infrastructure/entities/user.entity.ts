import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { AuditLog } from './audit-log.entity';
import { Address } from '../../../address/entities/address.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text' })
  password: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => RoleEntity, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  @OneToMany(() => RefreshTokenEntity, (token) => token.user)
  refreshTokens: RefreshTokenEntity[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];
}
