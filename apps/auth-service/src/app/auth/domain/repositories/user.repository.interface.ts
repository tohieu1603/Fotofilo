import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(page: number, limit: number, search?: string): Promise<{ users: User[]; total: number }>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  assignRole(userId: string, roleId: string): Promise<void>;
  removeRole(userId: string, roleId: string): Promise<void>;
}