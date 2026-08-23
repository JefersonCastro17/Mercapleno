import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../interfaces/auth-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthUser | undefined;
  },
);
