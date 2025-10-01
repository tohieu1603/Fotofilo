import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleEntityRepository: Repository<RoleEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userEntityRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    return userEntity ? UserMapper.toDomain(userEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userEntityRepository.findOne({
      where: { email },
      relations: ['roles'],
    });

    return userEntity ? UserMapper.toDomain(userEntity) : null;
  }

  async findAll(page: number, limit: number, search?: string): Promise<{ users: User[]; total: number }> {
    const queryBuilder = this.userEntityRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (search) {
      queryBuilder.where('user.name ILIKE :search OR user.email ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [userEntities, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const users = userEntities.map((entity) => UserMapper.toDomain(entity));
    return { users, total };
  }

  async save(user: User): Promise<void> {
    const userEntity = UserMapper.toPersistence(user);

    if (user.roles.length) {
      const roleIds = user.roles.map((role) => role.id);
      const roles = await this.roleEntityRepository.findBy({
        id: In(roleIds),
      });

      if (roles.length !== roleIds.length) {
        throw new Error('One or more roles could not be found');
      }

      userEntity.roles = roles;
    } else {
      userEntity.roles = [];
    }

    await this.userEntityRepository.save(userEntity);
  }

  async delete(id: string): Promise<void> {
    await this.userEntityRepository.delete(id);
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.userEntityRepository.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, roleId],
    );
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.userEntityRepository.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId],
    );
  }
}