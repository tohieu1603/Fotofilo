import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { Role } from '../../domain/entities/role.entity';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleEntityRepository: Repository<RoleEntity>,
  ) {}

  async findById(id: string): Promise<Role | null> {
    const roleEntity = await this.roleEntityRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    return roleEntity ? this.toDomain(roleEntity) : null;
  }

  async findByIds(ids: string[]): Promise<Role[]> {
    if (!ids.length) {
      return [];
    }

    const roleEntities = await this.roleEntityRepository.find({
      where: { id: In(ids) },
      relations: ['permissions'],
    });

    return roleEntities.map((entity) => this.toDomain(entity));
  }

  async findByName(name: string): Promise<Role | null> {
    const roleEntity = await this.roleEntityRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });

    return roleEntity ? this.toDomain(roleEntity) : null;
  }

  async findAll(): Promise<Role[]> {
    const roleEntities = await this.roleEntityRepository.find({
      relations: ['permissions'],
    });

    return roleEntities.map((entity) => this.toDomain(entity));
  }

  async save(role: Role): Promise<void> {
    const roleEntity = this.toPersistence(role);
    await this.roleEntityRepository.save(roleEntity);
  }

  async delete(id: string): Promise<void> {
    await this.roleEntityRepository.delete(id);
  }

  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    await this.roleEntityRepository.query(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [roleId, permissionId],
    );
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    await this.roleEntityRepository.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId],
    );
  }

  private toDomain(entity: RoleEntity): Role {
    return Role.create(
      entity.id,
      entity.name,
      entity.displayName,
      entity.description || '',
      entity.isActive,
      entity.isSystem,
    );
  }

  private toPersistence(role: Role): RoleEntity {
    const entity = new RoleEntity();
    entity.id = role.id;
    entity.name = role.name;
    entity.displayName = role.displayName;
    entity.description = role.description;
    entity.isActive = role.isActive;
    entity.isSystem = role.isSystem;
    return entity;
  }
}