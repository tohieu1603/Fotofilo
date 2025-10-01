import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Optional User Decorator - Không throw error nếu không có user
 * Sử dụng với OptionalJwtAuthGuard
 */
export const OptionalUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Nếu không có user, return null
    if (!user) {
      return null;
    }

    // Nếu data được cung cấp (ví dụ: 'userId'), return field cụ thể
    if (data) {
      return user[data] || user.sub || user.userId || user.id;
    }

    // Return toàn bộ user object
    return {
      id: user.sub || user.userId || user.id,
      email: user.email,
      roles: user.roles || [],
      ...user
    };
  },
);