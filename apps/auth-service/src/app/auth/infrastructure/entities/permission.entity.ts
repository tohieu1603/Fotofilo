import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Unique,
} from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('permissions')
@Unique(['resource', 'action'])
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[];
}
