import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
import { Permission } from '../../domain/entities/permission.entity';
import { PermissionEntity } from '../entities/permission.entity';

@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionEntityRepository: Repository<PermissionEntity>,
  ) {}

  async findById(id: string): Promise<Permission | null> {
    const permissionEntity = await this.permissionEntityRepository.findOne({
      where: { id },
    });

    return permissionEntity ? this.toDomain(permissionEntity) : null;
  }

  async findByResourceAndAction(resource: string, action: string): Promise<Permission | null> {
    const permissionEntity = await this.permissionEntityRepository.findOne({
      where: { resource, action },
    });

    return permissionEntity ? this.toDomain(permissionEntity) : null;
  }

  async findAll(): Promise<Permission[]> {
    const permissionEntities = await this.permissionEntityRepository.find();
    return permissionEntities.map((entity) => this.toDomain(entity));
  }

  async findByUserId(userId: string): Promise<Permission[]> {
    const permissionEntities = await this.permissionEntityRepository
      .createQueryBuilder('permission')
      .innerJoin('permission.roles', 'role')
      .innerJoin('role.users', 'user')
      .where('user.id = :userId', { userId })
      .getMany();

    return permissionEntities.map((entity) => this.toDomain(entity));
  }

  async save(permission: Permission): Promise<void> {
    const permissionEntity = this.toPersistence(permission);
    await this.permissionEntityRepository.save(permissionEntity);
  }

  async delete(id: string): Promise<void> {
    await this.permissionEntityRepository.delete(id);
  }

  private toDomain(entity: PermissionEntity): Permission {
    return Permission.create(
      entity.id,
      entity.name,
      entity.resource,
      entity.action,
      entity.displayName,
      entity.description || '',
      entity.isActive,
    );
  }

  private toPersistence(permission: Permission): PermissionEntity {
    const entity = new PermissionEntity();
    entity.id = permission.id;
    entity.name = permission.name;
    entity.resource = permission.resource;
    entity.action = permission.action;
    entity.displayName = permission.displayName;
    entity.description = permission.description;
    entity.isActive = permission.isActive;
    return entity;
  }
}
