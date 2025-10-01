import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new Error('User not found in request. Make sure JwtAuthGuard is applied.');
    }

    return {
      id: user.sub || user.userId || user.id,
      email: user.email,
      roles: user.roles || [],
      ...user
    };
  },
);