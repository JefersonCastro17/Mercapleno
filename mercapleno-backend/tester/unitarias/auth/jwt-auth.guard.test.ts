import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard (Unitarias)', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar true si el método de la solicitud es OPTIONS (preflight CORS)', () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => ({ method: 'OPTIONS' }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('debe retornar true si la ruta tiene el decorador @Public()', () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => ({ method: 'GET' }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalled();
  });

  it('debe llamar a super.canActivate si la ruta no es pública ni OPTIONS', () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => ({ method: 'GET' }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const superCanActivateSpy = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockReturnValue(true as any);

    const result = guard.canActivate(mockContext);

    expect(reflector.getAllAndOverride).toHaveBeenCalled();
    expect(superCanActivateSpy).toHaveBeenCalledWith(mockContext);
    expect(result).toBe(true);
  });
});
