import { Reflector } from '@nestjs/core';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RolesGuard } from '../../../src/auth/guards/roles.guard';

describe('RolesGuard (Unitarias)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let context: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
    context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => ({ method: 'GET', user: { id_rol: 2 } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
  });

  it('debe permitir la petición si el método es OPTIONS', () => {
    context.switchToHttp.mockReturnValue({
      getRequest: () => ({ method: 'OPTIONS' }),
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir el acceso si no hay roles requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar UnauthorizedException si no hay usuario en el request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([1, 2]);
    context.switchToHttp.mockReturnValue({
      getRequest: () => ({ method: 'GET', user: undefined }),
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('CP-053 - debe denegar el acceso si el usuario no tiene el rol requerido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([1]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debe permitir el acceso si el usuario tiene el rol requerido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([1, 2]);

    expect(guard.canActivate(context)).toBe(true);
  });
});
