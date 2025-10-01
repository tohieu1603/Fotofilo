import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => UserEntity, (user) => user.auditLogs, {
    onDelete: 'SET NULL',
  })
  user: UserEntity;

  @Column()
  action: string;

  @Column()
  resource: string;

  @Column({ nullable: true })
  resourceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues?: unknown;

  @Column({ type: 'jsonb', nullable: true })
  newValues?: unknown;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;
}
