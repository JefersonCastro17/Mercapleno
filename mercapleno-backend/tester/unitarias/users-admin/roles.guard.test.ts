import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../../../src/auth/guards/roles.guard';

describe('RolesGuard (Unitarias)', () => {
  // El guard valida si el usuario autenticado tiene permisos de administrador para ciertas rutas.
  let guard: RolesGuard;
  let reflector: Reflector;
  let context: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
    context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => ({ user: { id_rol: 2 } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
  });

  it('CP-053 - debe denegar el acceso si el usuario no es administrador', () => {
    // Se fuerza que la ruta requiera rol administrador y luego se valida que el guard lance una excepción.
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([1]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('CP-066 - debe denegar la eliminación de usuarios si el usuario no tiene permisos de administrador', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([1]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
