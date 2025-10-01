import { Role } from '../entities/role.entity';

export interface IRoleRepository {
  findById(id: string): Promise<Role | null>;
  findByIds(ids: string[]): Promise<Role[]>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  save(role: Role): Promise<void>;
  delete(id: string): Promise<void>;
  assignPermission(roleId: string, permissionId: string): Promise<void>;
  removePermission(roleId: string, permissionId: string): Promise<void>;
}