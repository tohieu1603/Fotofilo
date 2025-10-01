import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionType } from '../decorators/permissions.decorator';
import { AuthService } from '../auth.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionType[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (Array.isArray(user.roles) && user.roles.includes('admin')) {
      return true;
    }

    const hasPermissions = await this.authService.checkUserPermissions(
      user.userId ?? user.sub ?? user.id,
      requiredPermissions,
    );

    if (!hasPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
