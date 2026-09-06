import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest() as { method?: string; user?: AuthUser };

    if (req?.method === 'OPTIONS') {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<number[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no esta autenticado');
    }

    if (!requiredRoles.includes(user.id_rol)) {
      throw new ForbiddenException('Usuario no tiene permiso para acceder a este recurso');
    }

    return true;
  }
}