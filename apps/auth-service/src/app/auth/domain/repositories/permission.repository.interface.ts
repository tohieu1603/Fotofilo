import { Permission } from '../entities/permission.entity';

export interface IPermissionRepository {
  findById(id: string): Promise<Permission | null>;
  findByResourceAndAction(resource: string, action: string): Promise<Permission | null>;
  findAll(): Promise<Permission[]>;
  findByUserId(userId: string): Promise<Permission[]>;
  save(permission: Permission): Promise<void>;
  delete(id: string): Promise<void>;
}