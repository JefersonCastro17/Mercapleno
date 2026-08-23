import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  const mockExecutionContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('debe permitir acceso si no hay roles requeridos', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = mockExecutionContext();
    
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar UnauthorizedException si no hay usuario', () => {
    reflector.getAllAndOverride.mockReturnValue([1, 2]);
    const context = mockExecutionContext(undefined);
    
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Usuario no esta autenticado');
  });

  it('debe lanzar ForbiddenException si el rol no coincide', () => {
    reflector.getAllAndOverride.mockReturnValue([1, 2]);
    const context = mockExecutionContext({ id: 1, id_rol: 3, email: 'test@test.com' });
    
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Usuario no tiene permiso para acceder a este recurso');
  });

  it('debe permitir acceso si el rol coincide', () => {
    reflector.getAllAndOverride.mockReturnValue([1, 2]);
    const context = mockExecutionContext({ id: 1, id_rol: 1, email: 'test@test.com' });
    
    expect(guard.canActivate(context)).toBe(true);
  });
});
