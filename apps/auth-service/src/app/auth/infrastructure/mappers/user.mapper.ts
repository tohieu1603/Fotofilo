import { User, UserRole } from '../../domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  static toDomain(entity: UserEntity): User {
    const roles: UserRole[] =
      entity.roles?.map((role) => ({ id: role.id, name: role.name })) || [];

    return User.fromExisting({
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      hashedPassword: entity.password,
      roles,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.name = user.name;
    entity.email = user.email.getValue();
    entity.phone = user.phone;
    entity.password = user.password.getHashValue();
    entity.isActive = user.isActive;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    // Note: roles relationship handled separately
    return entity;
  }
}