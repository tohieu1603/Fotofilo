import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { Auth } from '@nestcm/proto';
import {
  ValidateTokenQuery,
  CheckPermissionQuery,
  GetUserPermissionsQuery,
} from '../queries/auth.queries';
import { TokenService } from '../services/token.service';
import { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
import { toProtoPermission } from '../mappers/user-proto.mapper';

interface TokenPayload {
  sub: string;
  email: string;
  roles?: string[];
}

@Injectable()
@QueryHandler(ValidateTokenQuery)
export class ValidateTokenHandler
  implements IQueryHandler<ValidateTokenQuery, Auth.ValidateTokenResponse>
{
  constructor(private readonly tokenService: TokenService) {}

  async execute(query: ValidateTokenQuery): Promise<Auth.ValidateTokenResponse> {
    const { accessToken } = query;

    try {
      const payload = (await this.tokenService.verifyToken(accessToken)) as TokenPayload;
      return {
        isValid: true,
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
      };
    } catch {
      return {
        isValid: false,
        userId: '',
        email: '',
        roles: [],
      };
    }
  }
}

@Injectable()
@QueryHandler(CheckPermissionQuery)
export class CheckPermissionHandler
  implements IQueryHandler<CheckPermissionQuery, Auth.CheckPermissionResponse>
{
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(query: CheckPermissionQuery): Promise<Auth.CheckPermissionResponse> {
    const { userId, resource, action } = query;

    const permissions = await this.permissionRepository.findByUserId(userId);
    const hasPermission = permissions.some((permission) =>
      permission.matches(resource, action),
    );

    return {
      hasPermission,
    };
  }
}

@Injectable()
@QueryHandler(GetUserPermissionsQuery)
export class GetUserPermissionsHandler
  implements IQueryHandler<GetUserPermissionsQuery, Auth.GetUserPermissionsResponse>
{
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(query: GetUserPermissionsQuery): Promise<Auth.GetUserPermissionsResponse> {
    const { userId } = query;

    const permissions = await this.permissionRepository.findByUserId(userId);

    return {
      permissions: permissions.map((permission) => toProtoPermission(permission)),
    };
  }
}