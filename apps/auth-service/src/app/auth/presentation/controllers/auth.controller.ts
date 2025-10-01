import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@nestcm/proto';
import {
  RegisterCommand,
  LoginCommand,
  RefreshTokenCommand,
  LogoutCommand,
} from '../../application/commands/auth.commands';
import {
  CreateUserCommand,
  UpdateUserCommand,
  DeleteUserCommand,
  AssignRoleToUserCommand,
  RemoveRoleFromUserCommand,
} from '../../application/commands/user.commands';
import {
  ValidateTokenQuery,
  CheckPermissionQuery,
  GetUserPermissionsQuery,
} from '../../application/queries/auth.queries';
import { GetAllUsersQuery, GetUserByIdQuery } from '../../application/queries/user.queries';

@Controller()
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @GrpcMethod('AuthService', 'Register')
  async register(request: Auth.RegisterRequest): Promise<Auth.AuthResponse> {
    const command = new RegisterCommand(
      request.name,
      request.email,
      request.phone,
      request.password,
    );

    return this.commandBus.execute<RegisterCommand, Auth.AuthResponse>(command);
  }

  @GrpcMethod('AuthService', 'Login')
  async login(request: Auth.LoginRequest): Promise<Auth.AuthResponse> {
    const command = new LoginCommand(request.email, request.password);
    return this.commandBus.execute<LoginCommand, Auth.AuthResponse>(command);
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(request: Auth.RefreshTokenRequest): Promise<Auth.AuthResponse> {
    const command = new RefreshTokenCommand(request.refreshToken);
    return this.commandBus.execute<RefreshTokenCommand, Auth.AuthResponse>(command);
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(request: Auth.ValidateTokenRequest): Promise<Auth.ValidateTokenResponse> {
    const query = new ValidateTokenQuery(request.accessToken);
    return this.queryBus.execute<ValidateTokenQuery, Auth.ValidateTokenResponse>(query);
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(request: Auth.LogoutRequest): Promise<Auth.LogoutResponse> {
    const command = new LogoutCommand(request.refreshToken);
    return this.commandBus.execute<LogoutCommand, Auth.LogoutResponse>(command);
  }

  @GrpcMethod('AuthService', 'GetAllUsers')
  async getAllUsers(request: Auth.GetAllUserRequest): Promise<Auth.GetAllUserResponse> {
    const query = new GetAllUsersQuery(request.page ?? 1, request.limit ?? 10, request.search ?? '');
    return this.queryBus.execute<GetAllUsersQuery, Auth.GetAllUserResponse>(query);
  }

  @GrpcMethod('AuthService', 'GetUserById')
  async getUserById(request: Auth.GetUserByIdRequest): Promise<Auth.UserResponse> {
    const query = new GetUserByIdQuery(request.id);
    return this.queryBus.execute<GetUserByIdQuery, Auth.UserResponse>(query);
  }

  @GrpcMethod('AuthService', 'CreateUser')
  async createUser(request: Auth.CreateUserRequest): Promise<Auth.UserResponse> {
    const command = new CreateUserCommand(
      request.name,
      request.email,
      request.phone,
      request.password,
      request.rolesId ?? [],
    );

    return this.commandBus.execute<CreateUserCommand, Auth.UserResponse>(command);
  }

  @GrpcMethod('AuthService', 'UpdateUser')
  async updateUser(request: Auth.UpdateUserRequest): Promise<Auth.UserResponse> {
    const command = new UpdateUserCommand(
      request.id,
      request.name,
      request.phone,
      request.email,
      request.rolesId ?? [],
      request.isActive,
    );

    return this.commandBus.execute<UpdateUserCommand, Auth.UserResponse>(command);
  }

  @GrpcMethod('AuthService', 'DeleteUser')
  async deleteUser(request: Auth.DeleteUserRequest): Promise<Auth.DeleteUserResponse> {
    const command = new DeleteUserCommand(request.id);
    return this.commandBus.execute<DeleteUserCommand, Auth.DeleteUserResponse>(command);
  }

  @GrpcMethod('AuthService', 'AssignRoleToUser')
  async assignRoleToUser(
    request: Auth.AssignRoleToUserRequest,
  ): Promise<Auth.AssignRoleToUserResponse> {
    const command = new AssignRoleToUserCommand(
      request.userId,
      request.roleId,
      request.assignedBy,
      request.expiresAt,
    );

    return this.commandBus.execute<AssignRoleToUserCommand, Auth.AssignRoleToUserResponse>(command);
  }

  @GrpcMethod('AuthService', 'RemoveRoleFromUser')
  async removeRoleFromUser(
    request: Auth.RemoveRoleFromUserRequest,
  ): Promise<Auth.RemoveRoleFromUserResponse> {
    const command = new RemoveRoleFromUserCommand(request.userId, request.roleId);
    return this.commandBus.execute<RemoveRoleFromUserCommand, Auth.RemoveRoleFromUserResponse>(command);
  }

  @GrpcMethod('AuthService', 'CheckPermission')
  async checkPermission(request: Auth.CheckPermissionRequest): Promise<Auth.CheckPermissionResponse> {
    const query = new CheckPermissionQuery(request.userId, request.resource, request.action);
    return this.queryBus.execute<CheckPermissionQuery, Auth.CheckPermissionResponse>(query);
  }

  @GrpcMethod('AuthService', 'GetUserPermissions')
  async getUserPermissions(
    request: Auth.GetUserPermissionsRequest,
  ): Promise<Auth.GetUserPermissionsResponse> {
    const query = new GetUserPermissionsQuery(request.userId);
    return this.queryBus.execute<GetUserPermissionsQuery, Auth.GetUserPermissionsResponse>(query);
  }
}