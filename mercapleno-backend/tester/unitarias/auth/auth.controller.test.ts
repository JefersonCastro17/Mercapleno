import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { JwtStrategy } from '../../../src/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../src/auth/guards/roles.guard';
import { Roles, ROLES_KEY } from '../../../src/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../src/auth/decorators/current-user.decorator';

import { RegisterDto } from '../../../src/auth/dto/register.dto';
import { LoginDto } from '../../../src/auth/dto/login.dto';
import { VerifyLoginCodeDto } from '../../../src/auth/dto/verify-login-code.dto';
import { VerifyEmailDto } from '../../../src/auth/dto/verify-email.dto';
import { ResendVerificationDto } from '../../../src/auth/dto/resend-verification.dto';
import { RequestPasswordResetDto } from '../../../src/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from '../../../src/auth/dto/reset-password.dto';

describe('AuthController y Guardias (Unitarias)', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    getDocumentTypes: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
    verifyLoginCode: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Controladores
  // =========================================================================
  describe('Controlador AuthController', () => {
    it('debe obtener los tipos de identificación llamando al servicio', async () => {
      const mockResult = [{ id: 1, nombre: 'CC' }];
      mockAuthService.getDocumentTypes.mockResolvedValue(mockResult);

      const result = await controller.getDocumentTypes();

      expect(authService.getDocumentTypes).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('debe registrar un usuario llamando al servicio con el DTO', async () => {
      const dto: RegisterDto = {
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@test.com',
        password: 'Password123!',
        direccion: 'Calle 123',
        fecha_nacimiento: '1995-05-05',
        id_tipo_identificacion: 1,
        numero_identificacion: '1234567890',
      };
      const mockResult = { success: true, message: 'Usuario registrado correctamente' };
      mockAuthService.register.mockResolvedValue(mockResult);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    it('debe iniciar sesión y establecer la cookie de access_token cuando devuelve un token', async () => {
      const dto: LoginDto = { email: 'juan@test.com', password: 'Password123!' };
      const mockResult = { success: true, token: 'mocked_jwt_token', usuario: { id: 1, id_rol: 3 } };
      mockAuthService.login.mockResolvedValue(mockResult);

      const mockReq = { secure: false, headers: {} } as Request;
      const mockRes = { cookie: jest.fn() } as unknown as Response;

      const result = await controller.login(dto, mockReq, mockRes);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(mockRes.cookie).toHaveBeenCalledWith('access_token', 'mocked_jwt_token', expect.objectContaining({
        httpOnly: true,
        path: '/',
      }));
      expect(result).toEqual(mockResult);
    });

    it('debe iniciar sesión en HTTPS y establecer cookie con secure y sameSite none', async () => {
      const dto: LoginDto = { email: 'juan@test.com', password: 'Password123!' };
      const mockResult = { success: true, token: 'mocked_jwt_token' };
      mockAuthService.login.mockResolvedValue(mockResult);

      const mockReq = { secure: false, headers: { 'x-forwarded-proto': 'https' } } as unknown as Request;
      const mockRes = { cookie: jest.fn() } as unknown as Response;

      const result = await controller.login(dto, mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith('access_token', 'mocked_jwt_token', expect.objectContaining({
        secure: true,
        sameSite: 'none',
      }));
      expect(result).toEqual(mockResult);
    });

    it('debe retornar pendingToken sin establecer cookie de token si requiere 2FA', async () => {
      const dto: LoginDto = { email: 'admin@test.com', password: 'Password123!' };
      const mockResult = { success: true, requires2FA: true, pendingToken: 'mocked_pending_token' };
      mockAuthService.login.mockResolvedValue(mockResult);

      const mockReq = { secure: false, headers: {} } as Request;
      const mockRes = { cookie: jest.fn() } as unknown as Response;

      const result = await controller.login(dto, mockReq, mockRes);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(mockRes.cookie).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('debe verificar el código 2FA y establecer la cookie de access_token', async () => {
      const dto: VerifyLoginCodeDto = { pendingToken: 'token123', code: '123456' };
      const mockResult = { success: true, token: 'mocked_jwt_token' };
      mockAuthService.verifyLoginCode.mockResolvedValue(mockResult);

      const mockReq = { secure: false, headers: {} } as Request;
      const mockRes = { cookie: jest.fn() } as unknown as Response;

      const result = await controller.verifyLoginCode(dto, mockReq, mockRes);

      expect(authService.verifyLoginCode).toHaveBeenCalledWith(dto);
      expect(mockRes.cookie).toHaveBeenCalledWith('access_token', 'mocked_jwt_token', expect.any(Object));
      expect(result).toEqual(mockResult);
    });

    it('no debe establecer cookie si verifyLoginCode no devuelve token', async () => {
      const dto: VerifyLoginCodeDto = { pendingToken: 'token123', code: '123456' };
      const mockResult = { success: false, message: 'Fallo verificación' };
      mockAuthService.verifyLoginCode.mockResolvedValue(mockResult);

      const mockReq = { secure: false, headers: {} } as Request;
      const mockRes = { cookie: jest.fn() } as unknown as Response;

      const result = await controller.verifyLoginCode(dto, mockReq, mockRes);

      expect(mockRes.cookie).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('debe delegar la verificación del correo al servicio', async () => {
      const dto: VerifyEmailDto = { email: 'juan@test.com', code: '123456' };
      const mockResult = { success: true, message: 'Correo verificado' };
      mockAuthService.verifyEmail.mockResolvedValue(mockResult);

      const result = await controller.verifyEmail(dto);

      expect(authService.verifyEmail).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    it('debe delegar el reenvío de verificación al servicio', async () => {
      const dto: ResendVerificationDto = { email: 'juan@test.com' };
      const mockResult = { success: true, message: 'Código reenviado' };
      mockAuthService.resendVerification.mockResolvedValue(mockResult);

      const result = await controller.resendVerification(dto);

      expect(authService.resendVerification).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    it('debe delegar la solicitud de recuperación de contraseña al servicio', async () => {
      const dto: RequestPasswordResetDto = { email: 'juan@test.com' };
      const mockResult = { success: true, message: 'Código de recuperación enviado' };
      mockAuthService.requestPasswordReset.mockResolvedValue(mockResult);

      const result = await controller.requestPasswordReset(dto);

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    it('debe delegar el restablecimiento de contraseña al servicio', async () => {
      const dto: ResetPasswordDto = { email: 'juan@test.com', code: '123456', newPassword: 'NewPassword123!', confirmPassword: 'NewPassword123!' };
      const mockResult = { success: true, message: 'Contraseña restablecida' };
      mockAuthService.resetPassword.mockResolvedValue(mockResult);

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    it('debe limpiar la cookie access_token y llamar al logout del servicio (HTTP)', () => {
      const mockReq = { secure: false, headers: {} } as Request;
      const mockRes = { clearCookie: jest.fn() } as unknown as Response;
      const mockResult = { success: true, message: 'Sesión cerrada' };
      mockAuthService.logout.mockReturnValue(mockResult);

      const result = controller.logout(mockReq, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token', expect.objectContaining({
        path: '/',
        secure: false,
        sameSite: 'lax',
      }));
      expect(authService.logout).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('debe limpiar la cookie access_token con secure y sameSite none en HTTPS', () => {
      const mockReq = { secure: true, headers: {} } as unknown as Request;
      const mockRes = { clearCookie: jest.fn() } as unknown as Response;
      const mockResult = { success: true, message: 'Sesión cerrada' };
      mockAuthService.logout.mockReturnValue(mockResult);

      const result = controller.logout(mockReq, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token', expect.objectContaining({
        path: '/',
        secure: true,
        sameSite: 'none',
      }));
      expect(result).toEqual(mockResult);
    });
  });

  // =========================================================================
  // Estrategia JwtStrategy
  // =========================================================================
  describe('Estrategia JwtStrategy', () => {
    let strategy: JwtStrategy;

    beforeEach(() => {
      strategy = new JwtStrategy();
    });

    it('debe validar y retornar AuthUser si el payload es válido', () => {
      const payload = { sub: '123', email: 'user@test.com', id_rol: 3, token_type: 'access' };
      const result = strategy.validate(payload);
      expect(result).toEqual({ id: 123, email: 'user@test.com', id_rol: 3 });
    });

    it('debe lanzar UnauthorizedException si sub o email son inválidos', () => {
      expect(() => strategy.validate({ sub: null, email: 'user@test.com', id_rol: 3, token_type: 'access' } as any)).toThrow(UnauthorizedException);
      expect(() => strategy.validate({ sub: '123', email: '', id_rol: 3, token_type: 'access' })).toThrow(UnauthorizedException);
      expect(() => strategy.validate({ sub: '123', email: 'user@test.com', id_rol: undefined, token_type: 'access' } as any)).toThrow(UnauthorizedException);
      expect(() => strategy.validate({ sub: '123', email: 'user@test.com', id_rol: 3, token_type: 'refresh' })).toThrow(UnauthorizedException);
    });

    it('debe extraer el token desde cookies o desde header Bearer', () => {
      const jwtFromRequestExtractor = (strategy as any)._jwtFromRequest;

      const reqCookie = { cookies: { access_token: 'cookie_token_value' } } as unknown as Request;
      expect(jwtFromRequestExtractor(reqCookie)).toBe('cookie_token_value');

      const reqHeader = { cookies: {}, headers: { authorization: 'Bearer bearer_token_value' } } as unknown as Request;
      expect(jwtFromRequestExtractor(reqHeader)).toBe('bearer_token_value');

      expect(jwtFromRequestExtractor(null)).toBeNull();
      expect(jwtFromRequestExtractor({ cookies: null, headers: { authorization: 'Basic token123' } } as any)).toBeNull();
    });
  });

  // =========================================================================
  // JwtAuthGuard
  // =========================================================================
  describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new JwtAuthGuard(reflector);
    });

    it('debe retornar true si el método es OPTIONS o la ruta es @Public()', () => {
      const mockContextOptions = {
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => ({ method: 'OPTIONS' }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
      expect(guard.canActivate(mockContextOptions)).toBe(true);

      const mockContextPublic = {
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => ({ method: 'GET' }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      expect(guard.canActivate(mockContextPublic)).toBe(true);
    });

    it('debe llamar a super.canActivate si la ruta no es pública ni OPTIONS', () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => ({ method: 'GET' }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockReturnValue(true as any);

      expect(guard.canActivate(mockContext)).toBe(true);
    });
  });

  // =========================================================================
  // RolesGuard & Decorators
  // =========================================================================
  describe('RolesGuard y Decoradores', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RolesGuard(reflector);
    });

    it('debe permitir si es OPTIONS, no hay roles requeridos o coincide el rol', () => {
      const ctxOptions = {
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => ({ method: 'OPTIONS' }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
      expect(guard.canActivate(ctxOptions)).toBe(true);

      const ctxNoRoles = {
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => ({ method: 'GET', user: { id: 1, id_rol: 3 } }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      expect(guard.canActivate(ctxNoRoles)).toBe(true);

      const ctxAdmin = {
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => ({ method: 'POST', user: { id: 1, id_rol: 1 } }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([1, 2]);
      expect(guard.canActivate(ctxAdmin)).toBe(true);
    });

    it('debe lanzar UnauthorizedException si no hay usuario y ForbiddenException si el rol no coincide', () => {
      const ctxNoUser = {
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => ({ method: 'POST', user: null }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([1, 2]);
      expect(() => guard.canActivate(ctxNoUser)).toThrow(UnauthorizedException);

      const ctxForbidden = {
        switchToHttp: jest.fn().mockReturnValue({ getRequest: () => ({ method: 'POST', user: { id: 10, id_rol: 3 } }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([1, 2]);
      expect(() => guard.canActivate(ctxForbidden)).toThrow(ForbiddenException);
    });

    it('debe registrar metadata correctamente con @Roles decorator', () => {
      class TestController {
        @Roles(1, 2)
        testMethod() {}
      }
      const meta = reflector.get<number[]>(ROLES_KEY, TestController.prototype.testMethod);
      expect(meta).toEqual([1, 2]);
    });

    it('debe extraer el usuario con @CurrentUser decorator', () => {
      class TestController {
        public testMethod(@CurrentUser() _user: any) {}
      }
      const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod');
      const factory = metadata[Object.keys(metadata)[0]].factory;
      const mockUser = { id: 1, id_rol: 1, email: 'admin@test.com' };
      const mockCtx = { switchToHttp: () => ({ getRequest: () => ({ user: mockUser }) }) } as unknown as ExecutionContext;
      expect(factory(null, mockCtx)).toEqual(mockUser);
    });
  });
});
