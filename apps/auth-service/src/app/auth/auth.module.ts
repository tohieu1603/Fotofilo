import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@nestcm/database';

import { RedisModule } from '../shared/redis/redis.module';

import { UserEntity } from './infrastructure/entities/user.entity';
import { RoleEntity } from './infrastructure/entities/role.entity';
import { PermissionEntity } from './infrastructure/entities/permission.entity';
import { RefreshTokenEntity } from './infrastructure/entities/refresh-token.entity';
import { AuditLog } from './infrastructure/entities/audit-log.entity';

import { UserRepository } from './infrastructure/repositories/user.repository';
import { RoleRepository } from './infrastructure/repositories/role.repository';
import { PermissionRepository } from './infrastructure/repositories/permission.repository';
import { RefreshTokenRepository } from './infrastructure/repositories/refresh-token.repository';

import { TokenService } from './application/services/token.service';
import { UserCacheService } from './application/services/user-cache.service';

import {
  RegisterHandler,
  LoginHandler,
  RefreshTokenHandler,
  LogoutHandler,
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  RemoveRoleFromUserHandler,
  CreateRoleHandler,
  AssignRoleToUserHandler,
  CreatePermissionHandler,
  AssignPermissionToRoleHandler,
  GetAllUsersHandler,
  GetUserByIdHandler,
  GetUserByEmailHandler,
  ValidateTokenHandler,
  CheckPermissionHandler,
  GetUserPermissionsHandler,
} from './application/handlers';

import { AuthController } from './presentation/controllers/auth.controller';
import { Address } from '../address/entities/address.entity';

const CommandHandlers = [
  RegisterHandler,
  LoginHandler,
  RefreshTokenHandler,
  LogoutHandler,
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  RemoveRoleFromUserHandler,
  CreateRoleHandler,
  AssignRoleToUserHandler,
  CreatePermissionHandler,
  AssignPermissionToRoleHandler,
];

const QueryHandlers = [
  GetAllUsersHandler,
  GetUserByIdHandler,
  GetUserByEmailHandler,
  ValidateTokenHandler,
  CheckPermissionHandler,
  GetUserPermissionsHandler,
];

const Repositories = [
  {
    provide: 'IUserRepository',
    useClass: UserRepository,
  },
  {
    provide: 'IRoleRepository',
    useClass: RoleRepository,
  },
  {
    provide: 'IPermissionRepository',
    useClass: PermissionRepository,
  },
  {
    provide: 'IRefreshTokenRepository',
    useClass: RefreshTokenRepository,
  },
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      PermissionEntity,
      RefreshTokenEntity,
      AuditLog,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '15m' },
    }),
    RedisModule,
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Repositories,
    TokenService,
    UserCacheService,
  ],
  exports: [TokenService],
})
export class AuthModule {}