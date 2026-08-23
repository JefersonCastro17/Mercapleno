import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../../src/email/email.service';
import { BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException, ConflictException } from '@nestjs/common';

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from '../../../src/auth/dto/login.dto';
import { RegisterDto } from '../../../src/auth/dto/register.dto';
import { RequestPasswordResetDto } from '../../../src/auth/dto/request-password-reset.dto';
import { ResetPasswordDto } from '../../../src/auth/dto/reset-password.dto';
import { VerifyLoginCodeDto } from '../../../src/auth/dto/verify-login-code.dto';
import { any } from 'joi';

describe('AuthService (Unitarias)', () => {

  let authService: AuthService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let jwtService: JwtService;


  // beforeEach() se ejecuta ANTES de CADA prueba (it).
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService, 
        {
          provide: PrismaService,

          useValue: {
            usuarios: {
              // jest.fn() crea funciones simuladas vacías para que podamos espiar o alterar su comportamiento
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            intentos_login: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {

          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked_jwt_token'),
            verifyAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {

          provide: EmailService,
          useValue: {
            // Simulamos sus funciones internas para no enviar correos reales
            sendVerificationCode: jest.fn(),
            sendLoginTwoFactorCode: jest.fn(),
            sendPasswordResetCode: jest.fn(),
          },
        },
      ],
    }).compile(); // Compilamos el módulo de pruebas



    // Obtenemos las instancias de los servicios desde el módulo compilado
    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  // afterEach() se ejecuta DESPUÉS de CADA prueba (it).
  afterEach(() => {
    // Limpiamos los "mocks" para que los datos de una prueba no interfieran en otra
    jest.clearAllMocks();
  });


  // RF-001.1: Registrar usuario
  describe('RF-001.1 Registrar usuario', () => {

    const registerDto = {
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      direccion: 'Test St',
      fecha_nacimiento: '2000-01-01',
      id_tipo_identificacion: 1,
      numero_identificacion: '1234567890',
    };

    /**
     * RF-001.1
     * CP-001
     */
    it('CP-001 - debe verificar que un usuario pueda registrarse correctamente.', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);
      jest.spyOn(prismaService.usuarios, 'create').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(emailService, 'sendVerificationCode').mockResolvedValue(undefined as any);

      const result = await authService.register(registerDto);

      expect(prismaService.usuarios.create).toHaveBeenCalled();
      expect(emailService.sendVerificationCode).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        emailSent: true,
        requiresVerification: true,
        message: 'Usuario registrado. Enviamos un codigo de verificacion a tu correo.',
      });
    });

    /**
     * RF-001.1
     * CP-002
     */
    it('CP-002 - debe verificar que el sistema no permita registrar un correo electrónico duplicado.', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 1,
        email: registerDto.email,
      } as any);

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
      expect(prismaService.usuarios.create).not.toHaveBeenCalled();
    });

    /**
     * RF-001.1
     * CP-003
     */
    it('CP-003 - debe verificar que el sistema no permita registrar un número de identificación duplicado.', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst')
        .mockResolvedValueOnce(null) // Simula que no hay correo duplicado
        .mockResolvedValueOnce({ id: 1 } as any); // Simula que hay número de identificación duplicado

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
      
      expect(prismaService.usuarios.findFirst).toHaveBeenNthCalledWith(1, {
        where: { email: registerDto.email },
        select: { id: true },
      });
      expect(prismaService.usuarios.findFirst).toHaveBeenNthCalledWith(2, {
        where: { numero_identificacion: registerDto.numero_identificacion },
        select: { id: true },
      });
    });

    /**
     * RF-001.1
     * CP-004
     */
    it('CP-004 - debe verificar la validación de campos obligatorios.', async () => {
      // Instanciamos el DTO con campos faltantes
      const dto = plainToInstance(RegisterDto, {
        // Falta nombre, email, password, etc.
      });

      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
      
      // Mapeamos las propiedades que tuvieron error
      const errorProperties = errors.map(e => e.property);
      expect(errorProperties).toContain('nombre');
      expect(errorProperties).toContain('email');
      expect(errorProperties).toContain('password');
      expect(errorProperties).toContain('numero_identificacion');
    });

    /**
     * RF-001.1
     * CP-005
     */
    it('CP-005 - debe verificar la validación del formato de los datos.', async () => {
      // Instanciamos el DTO con formatos incorrectos
      const dto = plainToInstance(RegisterDto, {
        nombre: '123', // Solo letras permitidas
        apellido: '456', // Solo letras permitidas
        email: 'correo_invalido', // Formato de email inválido
        password: 'debil', // No cumple reglas (12 chars, mayus, minus, etc)
        direccion: 'Test',
        fecha_nacimiento: 'fecha_invalida', // Formato fecha inválido
        id_tipo_identificacion: 'no_entero', // Debe ser entero
        numero_identificacion: 'ABC', // Solo dígitos permitidos
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      // Verificamos que las validaciones fallaron por formato
      const emailError = errors.find(e => e.property === 'email');
      expect(emailError!.constraints).toHaveProperty('isEmail');

      const passwordError = errors.find(e => e.property === 'password');
      expect(passwordError!.constraints).toHaveProperty('minLength');

      const identificacionError = errors.find(e => e.property === 'numero_identificacion');
      expect(identificacionError!.constraints).toHaveProperty('matches');
    });

    /**
     * RF-001.1
     * CP-006 - generar código de verificación de correo
     */
    it('CP-006 - debe generar el código de verificación de correo al registrar', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);
      const createSpy = jest.spyOn(prismaService.usuarios, 'create').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(emailService, 'sendVerificationCode').mockResolvedValue(undefined as any);

      await authService.register(registerDto);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email_verification_code: expect.any(String),
            email_verification_expires: expect.any(Date),
          }),
        }),
      );
    });

    /**
     * RF-001.1
     * CP-007
     */
    it('CP-007 - debe verificar el almacenamiento seguro de la contraseña.', async () => {
      const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);
      const createSpy = jest.spyOn(prismaService.usuarios, 'create').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(emailService, 'sendVerificationCode').mockResolvedValue(undefined as any);

      await authService.register(registerDto);

      expect(hashSpy).toHaveBeenCalledWith(registerDto.password, 10);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password', // Sólo guarda el cifrado
          }),
        }),
      );
    });

    /**
     * RF-001.1
     * CP-008
     */
    it('CP-008 - debe verificar el comportamiento cuando falla el envío del correo electrónico.', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);
      jest.spyOn(prismaService.usuarios, 'create').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(emailService, 'sendVerificationCode').mockRejectedValue(new Error('Email failed'));

      const result = await authService.register(registerDto);

      expect(result).toEqual({
        success: true,
        emailSent: false, // El correo falló
        requiresVerification: true,
        message: 'Usuario registrado, pero no se pudo enviar el correo. Usa reenviar codigo.',
      });
    });
  });


// RF-001.2: Verificar Correo Electrónico
  describe('RF-001.2: Verificar Correo Electrónico', () => {

    /**
     * RF-001.2
     * CP-009
     */
    it('CP-009 - debe verificar correctamente el correo electrónico con código válido', async () => {
      const verificationCode = '123456';
      const verificationHash = crypto.createHash('sha256').update(verificationCode).digest('hex');

      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 1,
        email_verified: false,
        email_verification_code: verificationHash,
        email_verification_expires: new Date(Date.now() + 10000),
      } as any);
      const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);

      const result = await authService.verifyEmail({ email: 'test@test.com', code: verificationCode });

      expect(result).toEqual({
        success: true,
        message: 'Correo verificado correctamente.',
      });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          email_verified: true,
          email_verification_code: null,
          email_verification_expires: null,
        },
      });
    });


    /**
     * RF-001.2
     * CP-010
     */
    it('CP-010 - debe impedir la verificación cuando el código es incorrecto', async () => {
      const verificationHash = crypto.createHash('sha256').update('000000').digest('hex');

      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 1,
        email_verified: false,
        email_verification_code: verificationHash,
        email_verification_expires: new Date(Date.now() + 10000),
      } as any);
      const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);

      await expect(authService.verifyEmail({ email: 'test@test.com', code: '123456' })).rejects.toThrow(ForbiddenException);
      expect(updateSpy).not.toHaveBeenCalled();
    });


    /**
     * RF-001.2
     * CP-011
     */
    it('CP-011 - debe impedir la verificación cuando el código está expirado', async () => {
      const verificationCode = '123456';
      const verificationHash = crypto.createHash('sha256').update(verificationCode).digest('hex');

      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 1,
        email_verified: false,
        email_verification_code: verificationHash,
        email_verification_expires: new Date(Date.now() - 10000), // Expirado
      } as any);
      const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);

      await expect(authService.verifyEmail({ email: 'test@test.com', code: verificationCode })).rejects.toThrow(BadRequestException);
      expect(updateSpy).not.toHaveBeenCalled();
    });


    /**
     * RF-001.2
     * CP-012
     */
    it('CP-012 - debe retornar éxito si el correo ya está verificado', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 1,
        email_verified: true, // Ya verificado
      } as any);

      // Llamamos al método
      const result = await authService.verifyEmail({ email: 'test@test.com', code: '123456' });

      expect(result).toEqual({
        success: true,
        message: 'El correo ya esta verificado.',
      });
    });


    

    /**
     * RF-001.2
     * CP-013
     */
    it('CP-013 - debe arrojar Error si hay un error en BD al verificar', async () => {
      // En pruebas unitarias usamos un mock para simular el fallo de consulta en la BD.
      jest.spyOn(prismaService.usuarios, 'findFirst').mockRejectedValue(new Error('DB Error'));
      await expect(authService.verifyEmail({ email: 'test@test.com', code: '123456' })).rejects.toThrow(Error);
    });
  });


  // RF-001.3 Reenviar Código de verificación
  describe('RF-001.3: Reenviar Código de Verificación', () => {

    /**
     * RF-001.3
     * CP-014
     */
    it('CP-014 - debe reenviar exitosamente el código', async () => {
      // Simulamos que el usuario existe y no está verificado
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({ id: 1, email_verified: false } as any);
      // Simulamos éxito en la actualización del código en BD
      jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
      // Simulamos éxito enviando el correo
      jest.spyOn(emailService, 'sendVerificationCode').mockResolvedValue(undefined as any);

      // Llamamos a la función
      const result = await authService.resendVerification({ email: 'test@test.com' });

      // Verificamos la respuesta exitosa
      expect(result).toEqual({
        success: true,
        message: 'Codigo reenviado. Revisa tu correo.',
      });
      // Verificamos que se modificó la DB y se envió el correo
      expect(prismaService.usuarios.update).toHaveBeenCalled();
      expect(emailService.sendVerificationCode).toHaveBeenCalled();
    });

    /*
     * RF-001.3
     * CP-015
     */
    it('CP-015 - debe arrojar NotFoundException si el correo no está registrado', async () => {
      // Simulamos que el usuario no existe en la base de datos (retorna null)
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(null);

      // Verificamos que lance la excepción NotFoundException
      await expect(authService.resendVerification({ email: 'noexist@test.com' })).rejects.toThrow(NotFoundException);
    });

    /*
     * RF-001.3
     * CP-016
     */
    it('CP-016 - debe retornar éxito sin enviar correo si ya está verificado', async () => {
      // Simulamos que el usuario ya está verificado
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({ id: 1, email_verified: true } as any);
      
      // Llamamos al reenvío
      const result = await authService.resendVerification({ email: 'test@test.com' });

      // Validamos el éxito anticipado
      expect(result).toEqual({
        success: true,
        message: 'El correo ya esta verificado.',
      });
      // Validamos explícitamente que NO se haya intentado enviar ningún correo
      expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
    });

    /**
     * RF-001.3
     * CP-017
     */
    it('CP-017 - debe propagar excepción si falla el envío de correo', async () => {
      // Simulamos usuario válido
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({ id: 1, email_verified: false } as any);
      jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
      // Forzamos el error al enviar el email
      const sendSpy = jest.spyOn(emailService, 'sendVerificationCode').mockRejectedValue(new Error('Mail Error'));

      // Verificamos que se arroje un Error nativo (no capturado por try-catch que mapee)
      await expect(authService.resendVerification({ email: 'test@test.com' })).rejects.toThrow(Error);
      expect(sendSpy).toHaveBeenCalled();
    });

    /**
     * RF-001.3
     * CP-018
     */
    it('CP-018 - debe arrojar Error si falla la actualización en BD', async () => {
      // Simulamos que la BD falla al actualizar el registro
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({ id: 1, email_verified: false } as any);
      const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockRejectedValue(new Error('DB Error'));
      const sendSpy = jest.spyOn(emailService, 'sendVerificationCode');

      // Verificamos el error propagado
      await expect(authService.resendVerification({ email: 'test@test.com' })).rejects.toThrow(Error);
      expect(updateSpy).toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });



  // RF-001.4: Inicio de Sesión
  describe('Inicio de Sesión', () => {
    // Declaramos un DTO para el inicio de sesión
    const loginDto = { email: 'test@example.com', password: 'Password123!' };

    /*
     * RF-001.4
     * CP-019 
     */
    it('CP-019 - debe iniciar sesión correctamente para cliente verificado y generar token de acceso', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 1,
        password: 'hashed_password',
        id_rol: 3,
        email_verified: true,
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        roles: { nombre: 'Cliente' },
        tipos_identificacion: { nombre: 'CC' },
      } as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        success: true,
        message: 'Inicio de sesion exitoso',
        token: 'mocked_jwt_token',
        user: {
          id: 1,
          nombre: 'Test',
          apellido: 'User',
          email: 'test@example.com',
          id_rol: 3,
          email_verified: true,
          rol: 'Cliente',
          tipo_documento: 'CC',
        },
      });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          login_two_factor_code: null,
          login_two_factor_expires: null,
        },
      });
    });

    /*
     * RF-001.5
     * CP-026
     */
    it('CP-026 - debe verificar que el sistema no solicite doble factor a los usuarios con rol Cliente', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 1,
        password: 'hashed_password',
        id_rol: 3,
        email_verified: true,
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        roles: { nombre: 'Cliente' },
        tipos_identificacion: { nombre: 'CC' },
      } as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);

      const result = await authService.login(loginDto);

      expect(result).toEqual(expect.objectContaining({
        success: true,
        token: 'mocked_jwt_token',
        user: expect.objectContaining({ rol: 'Cliente' }),
      }));
      expect((result as any).requiresTwoFactor).toBeUndefined();
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          login_two_factor_code: null,
          login_two_factor_expires: null,
        },
      });
    });

    /*
     * RF-001.4
     * CP-020
     */
    it('CP-020 - debe fallar si la contraseña es incorrecta', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 1,
        password: 'hashed_password',
        id_rol: 3,
        email_verified: true,
      } as any);
      const compareSpy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(authService.login(loginDto)).rejects.toThrow(ForbiddenException);
      expect(compareSpy).toHaveBeenCalledWith(loginDto.password, 'hashed_password');
    });


    /*
     * RF-001.4
     * CP-021
     */
    it('CP-021 - debe arrojar error si el correo no está registrado', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(NotFoundException);
    });

    /*
     * RF-001.4
     * CP-022
     */
    it('CP-022 - debe impedir el inicio de sesión si el correo no está verificado', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 1,
        password: 'hashed_password',
        id_rol: 3,
        email_verified: false,
      } as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(authService.login(loginDto)).rejects.toThrow(ForbiddenException);
    });


    /**
     * RF-001.4
     * CP-023
     */
    it('CP-023 - debe validar campos obligatorios del inicio de sesión', async () => {
      const missingEmail = plainToInstance(LoginDto, { password: 'Password123!' });
      const errorsEmail = await validate(missingEmail);
      expect(errorsEmail.map(e => e.property)).toContain('email');

      const missingPassword = plainToInstance(LoginDto, { email: 'test@example.com' });
      const errorsPassword = await validate(missingPassword);
      expect(errorsPassword.map(e => e.property)).toContain('password');

      const missingBoth = plainToInstance(LoginDto, {});
      const errorsBoth = await validate(missingBoth);
      expect(errorsBoth.map(e => e.property)).toEqual(expect.arrayContaining(['email', 'password']));
    });

    /**
     * RF-001.4
     * CP-024
     */
    it('CP-024 - debe iniciar el proceso 2FA para usuarios Administrador y Empleado', async () => {
      const userAdmin = {
        id: 2,
        password: 'hashed_password',
        id_rol: 1,
        email_verified: true,
        email: 'admin@test.com',
        nombre: 'Admin',
        apellido: 'User',
        roles: { nombre: 'Administrador' },
      } as any;
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValueOnce(userAdmin);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
      jest.spyOn(emailService, 'sendLoginTwoFactorCode').mockResolvedValue(undefined as any);

      const adminResult = await authService.login(loginDto);
      expect(adminResult).toEqual({
        success: true,
        message: 'Enviamos un codigo de segundo factor a tu correo para completar el inicio de sesion.',
        requiresTwoFactor: true,
        pendingToken: 'mocked_jwt_token',
        twoFactorExpiresInMinutes: expect.any(Number),
        user: {
          id: 2,
          email: 'admin@test.com',
          id_rol: 1,
          rol: 'Administrador',
        },
      });

      const userEmployee = {
        id: 3,
        password: 'hashed_password',
        id_rol: 2,
        email_verified: true,
        email: 'empleado@test.com',
        nombre: 'Empleado',
        apellido: 'User',
        roles: { nombre: 'Empleado' },
      } as any;
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValueOnce(userEmployee);
      const employeeResult = await authService.login(loginDto);

      expect(employeeResult).toEqual({
        success: true,
        message: 'Enviamos un codigo de segundo factor a tu correo para completar el inicio de sesion.',
        requiresTwoFactor: true,
        pendingToken: 'mocked_jwt_token',
        twoFactorExpiresInMinutes: expect.any(Number),
        user: {
          id: 3,
          email: 'empleado@test.com',
          id_rol: 2,
          rol: 'Empleado',
        },
      });
    });
});


// RF-001.5: Doble Factor (2FA)
describe('Doble Factor (2FA)', () => {


  /**
   * RF-001.5
   * CP-025 - Genera y envía código 2FA correctamente para Admin/Empleado
   */
  it('CP-025 - debe generar y enviar el código 2FA para administradores/empleados', async () => {
    const user = { id: 10, email: 'admin2@test.com', id_rol: 1, roles: { nombre: 'Administrador' } } as any;
    const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
    const sendSpy = jest.spyOn(emailService, 'sendLoginTwoFactorCode').mockResolvedValue(undefined as any);

    const res = await (authService as any).createLoginTwoFactorChallenge(user);

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          login_two_factor_code: expect.any(String),
          login_two_factor_expires: expect.any(Date),
        }),
      }),
    );
    expect(sendSpy).toHaveBeenCalled();
    expect(res).toEqual(expect.objectContaining({ success: true, requiresTwoFactor: true, pendingToken: expect.any(String) }));
  });



  /**
   * RF-001.5
   * CP-027 - El código 2FA se invalida después de usarse correctamente
   */
  it('CP-027 - debe invalidar el código 2FA después de un uso exitoso', async () => {
    const pendingPayload = { sub: 20, email: 'user2@test.com', id_rol: 1, token_type: 'login_2fa' };
    jest.spyOn(jwtService, 'verify').mockReturnValue(pendingPayload as any);

    const code = '123456';
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    const userWithCode = {
      id: 20,
      email: 'user2@test.com',
      id_rol: 1,
      login_two_factor_code: codeHash,
      login_two_factor_expires: new Date(Date.now() + 10000),
      roles: { nombre: 'Administrador' },
    } as any;

    const userNoCode = { // Simula que el código ya fue usado y no existe
      id: 20,
      email: 'user2@test.com',
      id_rol: 1,
      login_two_factor_code: null,
      login_two_factor_expires: null,
      roles: { nombre: 'Administrador' },
    } as any;

    jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValueOnce(userWithCode).mockResolvedValueOnce(userNoCode);
    const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);

    const first = await authService.verifyLoginCode({ pendingToken: 'token', code });
    expect(first).toEqual(expect.objectContaining({ success: true, token: expect.any(String), user: expect.any(Object) }));
    expect(updateSpy).toHaveBeenCalledWith({ where: { id: 20 }, data: { login_two_factor_code: null, login_two_factor_expires: null } });

    await expect(authService.verifyLoginCode({ pendingToken: 'token', code })).rejects.toThrow(BadRequestException);
  });


  
  /**
   * RF-001.5
   * CP-028 - Expiración válida del código 2FA
   */
  it('CP-028 - debe establecer una expiración futura válida para el código 2FA y rechazar expirados', async () => {
    const user = { id: 1, email: 'test@test.com' } as any;
    jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
    jest.spyOn(emailService, 'sendLoginTwoFactorCode').mockResolvedValue(undefined as any);

    const res = await (authService as any).createLoginTwoFactorChallenge(user);
    expect(prismaService.usuarios.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ login_two_factor_expires: expect.any(Date) }) }),
    );
    expect(res).toBeDefined();

    // Ahora simulamos que el código expiró y la verificación debe fallar
    const pendingPayload = { sub: 60, email: 'user6@test.com', id_rol: 1, token_type: 'login_2fa' };
    jest.spyOn(jwtService, 'verify').mockReturnValue(pendingPayload as any);
    jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({ id: 60, login_two_factor_code: 'hashed', login_two_factor_expires: new Date(Date.now() - 10000) } as any);
    jest.spyOn(authService as any, 'clearLoginTwoFactorChallenge').mockResolvedValue({});

    await expect(authService.verifyLoginCode({ pendingToken: 'token', code: '123456' })).rejects.toThrow(BadRequestException);
  });



  /**
   * RF-001.5
   * CP-029 - Manejo cuando falla el envío del correo 2FA
   */
  it('CP-029 - debe limpiar el código y arrojar error 500 si falla el correo de 2FA', async () => {
    const user = { id: 1, email: 'test@test.com' } as any;
    jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
    jest.spyOn(emailService, 'sendLoginTwoFactorCode').mockRejectedValue(new Error('Mail Error'));
    const clearSpy = jest.spyOn(authService as any, 'clearLoginTwoFactorChallenge').mockResolvedValue({});

    await expect((authService as any).createLoginTwoFactorChallenge(user)).rejects.toThrow(InternalServerErrorException);
    expect(clearSpy).toHaveBeenCalledWith(1);
  });


  /**
   * RF-001.5
   * CP-030 - Rechaza código 2FA incorrecto
   */
  it('CP-030 - debe rechazar un código 2FA incorrecto', async () => {
    const pendingPayload = { sub: 50, email: 'user5@test.com', id_rol: 1, token_type: 'login_2fa' };
    jest.spyOn(jwtService, 'verify').mockReturnValue(pendingPayload as any);
    const correctHash = crypto.createHash('sha256').update('123456').digest('hex');

    jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
      id: 50,
      email: 'user5@test.com',
      id_rol: 1,
      login_two_factor_code: correctHash,
      login_two_factor_expires: new Date(Date.now() + 10000),
    } as any);

    await expect(authService.verifyLoginCode({ pendingToken: 'token', code: '000000' })).rejects.toThrow(ForbiddenException);
  });



  /**
   * RF-001.5
   * CP-031 - Verifica código 2FA válido completa inicio de sesión
   */
  it('CP-031 - debe completar el inicio de sesión con un código 2FA válido', async () => {
    const pendingPayload = { sub: 30, email: 'user3@test.com', id_rol: 1, token_type: 'login_2fa' };
    jest.spyOn(jwtService, 'verify').mockReturnValue(pendingPayload as any);
    const code = '123456';
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    const user = {
      id: 30,
      email: 'user3@test.com',
      id_rol: 1,
      email_verified: true,
      login_two_factor_code: codeHash,
      login_two_factor_expires: new Date(Date.now() + 10000),
      nombre: 'Admin',
      apellido: 'User',
      roles: { nombre: 'Administrador' },
      tipos_identificacion: { nombre: 'CC' },
    } as any;

    jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(user);
    const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);

    const result = await authService.verifyLoginCode({ pendingToken: 'token', code });

    expect(result).toEqual(expect.objectContaining({ success: true, token: expect.any(String), user: expect.any(Object) }));
    expect(updateSpy).toHaveBeenCalledWith({ where: { id: 30 }, data: { login_two_factor_code: null, login_two_factor_expires: null } });
  });

  
  /**
   * RF-001.5
   * CP-032 - Rechaza código 2FA incorrecto
   */
  it('CP-032 - debe rechazar un código de doble factor incorrecto', async () => {
    const pendingPayload = { sub: 40, email: 'user4@test.com', id_rol: 1, token_type: 'login_2fa' };
    jest.spyOn(jwtService, 'verify').mockReturnValue(pendingPayload as any);
    const correctHash = crypto.createHash('sha256').update('123456').digest('hex');

    const updateSpy = jest.spyOn(prismaService.usuarios, 'update');
    jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
      id: 40,
      email: 'user4@test.com',
      id_rol: 1,
      login_two_factor_code: correctHash,
      login_two_factor_expires: new Date(Date.now() + 10000),
    } as any);

    await expect(authService.verifyLoginCode({ pendingToken: 'token', code: '000000' })).rejects.toThrow(ForbiddenException);
    expect(updateSpy).not.toHaveBeenCalled();
  });


  /**
   * RF-001.5
   * CP-033 - Rechaza código 2FA expirado
   */
  it('CP-033 - debe rechazar un código de doble factor expirado', async () => {
    const pendingPayload = { sub: 60, email: 'user6@test.com', id_rol: 1, token_type: 'login_2fa' };
    jest.spyOn(jwtService, 'verify').mockReturnValue(pendingPayload as any);
    const user = {
      id: 60,
      email: 'user6@test.com',
      id_rol: 1,
      login_two_factor_code: 'hashed',
      login_two_factor_expires: new Date(Date.now() - 10000),
      roles: { nombre: 'Administrador' },
    } as any;

    jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(user);
    const clearSpy = jest.spyOn(authService as any, 'clearLoginTwoFactorChallenge').mockResolvedValue({});

    await expect(authService.verifyLoginCode({ pendingToken: 'token', code: '123456' })).rejects.toThrow(BadRequestException);
    expect(clearSpy).toHaveBeenCalledWith(60);
  });



  /**
   * RF-001.5
   * CP-034 - Valida obligatoriedad del código de doble factor
   */
  it('CP-034 - debe validar la obligatoriedad del código de doble factor', async () => {
    const dto = plainToInstance(VerifyLoginCodeDto, { pendingToken: 'token', code: '' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.map(error => error.property)).toContain('code');
    expect(errors.find(error => error.property === 'code')?.constraints).toHaveProperty('isNotEmpty');
  });



  /**
   * RF-001.5
   * CP-035 - Manejo de error durante la consulta del usuario para 2FA
   */
  it('CP-035 - debe manejar error al consultar la información del usuario para verificación 2FA', async () => {
    const pendingPayload = { sub: 70, email: 'user7@test.com', id_rol: 1, token_type: 'login_2fa' };
    jest.spyOn(jwtService, 'verify').mockReturnValue(pendingPayload as any);
    jest.spyOn(prismaService.usuarios, 'findFirst').mockRejectedValue(new Error('DB Error'));

    await expect(authService.verifyLoginCode({ pendingToken: 'token', code: '123456' })).rejects.toThrow(Error);
  });

  // RF-001.7: Solicitar Recuperación de Contraseña
  describe('RF-001.7: Solicitar Recuperación de Contraseña', () => {


    /**
     * RF-001.7
     * CP-036 - Solicitar recuperación de contraseña con correo registrado
     */
    it('CP-036 - debe solicitar correctamente la recuperación de contraseña para un correo registrado', async () => {
      const email = 'registered@test.com';
      const user = { id: 100 } as any;
      const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(user);
      jest.spyOn(emailService, 'sendPasswordResetCode').mockResolvedValue(undefined as any);

      const result = await authService.requestPasswordReset({ email } as RequestPasswordResetDto);

      expect(result).toEqual({ success: true, message: 'Si el correo existe, se envio un codigo.' });
      expect(prismaService.usuarios.findFirst).toHaveBeenCalledWith({ where: { email } , select: { id: true } });
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 100 },
        data: expect.objectContaining({
          password_reset_code: expect.any(String),
          password_reset_expires: expect.any(Date),
        }),
      }));
      expect(emailService.sendPasswordResetCode).toHaveBeenCalledWith(email, expect.any(String), expect.any(Number));
    });


    /**
     * RF-001.7
     * CP-037 - Mensaje genérico para correo no registrado
     */
    it('CP-037 - debe retornar mensaje genérico cuando el correo no está registrado', async () => {
      const email = 'unknown@test.com';
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(null);
      const updateSpy = jest.spyOn(prismaService.usuarios, 'update');
      const sendSpy = jest.spyOn(emailService, 'sendPasswordResetCode');

      const result = await authService.requestPasswordReset({ email } as RequestPasswordResetDto);

      expect(result).toEqual({ success: true, message: 'Si el correo existe, se envio un codigo.' });
      expect(updateSpy).not.toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
    });


    /**
     * RF-001.7
     * CP-038 - Validación del campo correo electrónico
     */
    it('CP-038 - debe validar el campo correo electrónico para solicitar la recuperación de contraseña', async () => {
      const emptyDto = plainToInstance(RequestPasswordResetDto, { email: '' });
      const invalidDto = plainToInstance(RequestPasswordResetDto, { email: 'invalid-email' });

      const emptyErrors = await validate(emptyDto);
      const invalidErrors = await validate(invalidDto);

      expect(emptyErrors.map(e => e.property)).toContain('email');
      expect(emptyErrors.find(e => e.property === 'email')?.constraints).toHaveProperty('isEmail');
      expect(invalidErrors.map(e => e.property)).toContain('email');
      expect(invalidErrors.find(e => e.property === 'email')?.constraints).toHaveProperty('isEmail');
    });


    /**
     * RF-001.7
     * CP-039 - Error al enviar código de recuperación por correo
     */
    it('CP-039 - debe manejar el fallo al enviar el codigo de recuperación por correo', async () => {
      const email = 'registered@test.com';
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({ id: 101 } as any);
      jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
      jest.spyOn(emailService, 'sendPasswordResetCode').mockRejectedValue(new Error('Mail Error'));

      await expect(authService.requestPasswordReset({ email } as RequestPasswordResetDto)).rejects.toThrow(Error);
    });


    /**
     * RF-001.7
     * CP-040 - Nueva solicitud reemplaza el código anterior
     */
    it('CP-040 - debe reemplazar el codigo anterior de recuperación con una nueva solicitud', async () => {
      const email = 'registered@test.com';
      const user = { id: 102 } as any;
      const firstCode = '111111';
      const secondCode = '222222';

      const generateSpy = jest.spyOn(authService as any, 'generateCode').mockReturnValueOnce(firstCode).mockReturnValueOnce(secondCode);
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(user);
      const updateSpy = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
      jest.spyOn(emailService, 'sendPasswordResetCode').mockResolvedValue(undefined as any);

      await authService.requestPasswordReset({ email } as RequestPasswordResetDto);
      await authService.requestPasswordReset({ email } as RequestPasswordResetDto);

      expect(updateSpy).toHaveBeenLastCalledWith(expect.objectContaining({
        where: { id: 102 },
        data: expect.objectContaining({ password_reset_code: authService['hashCode'](secondCode) }),
      }));

      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 102,
        password_reset_code: authService['hashCode'](secondCode),
        password_reset_expires: new Date(Date.now() + 10000),
      } as any);

      await expect(authService.resetPassword({
        email,
        code: firstCode,
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      } as ResetPasswordDto)).rejects.toThrow(ForbiddenException);
      expect(generateSpy).toHaveBeenCalledTimes(2);
    });
  });
});


 // RF-001.8 - Reestablecer Contraseña
  describe('RF-001.8: Reestablecer Contraseña', () => {

    /**
     * RF-001.8
     * CP-041 - Reestablecer contraseña con código válido
     */
    it('CP-041 - debe restablecer correctamente la contraseña con un código válido', async () => {
      const email = 'test@test.com';
      const code = '123456';
      const newPassword = 'NewPassword123!';
      
      const user = {
        id: 100,
        email,
        password_reset_code: authService ['hashCode'](code),
        password_reset_expires: new Date(Date.now() + 10000),
      } as any;

    jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(user);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_new_password' as never);

    const actualizarCon = jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({} as any);
    
    const result = await authService.resetPassword({
      email,
      code,
      newPassword,
      confirmPassword: newPassword,
    } as ResetPasswordDto);

    expect(result).toEqual({
      success: true,
      message: 'Contrasena actualizada correctamente.',
    });

    expect(actualizarCon).toHaveBeenCalledWith({
      where: {
        id: 100,
      },
      data: {
        password: 'hashed_new_password',
        password_reset_code: null,
        password_reset_expires: null,
      },
    })

    });


    /**
     * RF-001.8
     * CP-042 - Rechaza reestablecimiento con código inválido
     */
    it('CP-042 - debe rechazar un código de recuperació incorrecto', async () => {
      const email = 'test@test.com';
      const code = '123456';
      const incorrectoCodigo = '000000';
      const nuevaPassword = 'NuevaPassword123!';

      const user = {
        id: 100,
        email,
        password_reset_code: authService['hashCode'](code),
        password_reset_expires: new Date(Date.now() + 10000),
      } as any;

      // Simulamos que el usuario existe y tiene un código válido
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(user);

      const actualizarCon = jest.spyOn(prismaService.usuarios, 'update');

      await expect(
        authService.resetPassword({
          email,
          code: incorrectoCodigo,
          nuevaPassword,
          confirmPassword: nuevaPassword,
        }as any),
      ).rejects.toThrow(ForbiddenException);
    
    expect(actualizarCon).not.toHaveBeenCalled();
  });


  /**
   * RF-001.8
   * CP-043 - Rechaza reestablecimiento con código expirado
   */
    it('CP-043 - debe impedir restablecer la contraseña cuando el código ha expirado', async () => {
      const email = 'test@test.com';
      const code = '123456';
      const nuevaContrasena = 'NewPassword123!';

      const expiradoCodigo = authService['hashCode'](code);

      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({
        id: 100,
        email,
        password_reset_code: expiradoCodigo,
        password_reset_expires: new Date(Date.now() - 10000), // Expired
      }as any);

      const actualizarCon = jest.spyOn(prismaService.usuarios, 'update');
  
      await expect(
        authService.resetPassword({
          email,
          code,
          nuevaContrasena,
          confirmPassword: nuevaContrasena,
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(actualizarCon).not.toHaveBeenCalled();
});
  

  /**
   * RF-001.8
   * CP-044 - Validación de los requisitos de la contraseña nueva
   */
    it('CP-044 - debe validar los requisitos de la nueva contraseña', async () => {

      const dto = plainToInstance(ResetPasswordDto, {
        email: 'test@test.com',
        code: '123456',
        newPassword: 'mala',
        confirmPassword: 'mala',
      });

      const errores = await validate(dto);

      expect(errores.length).toBeGreaterThan(0);

      const contrasenaError = errores.find(
        error => error.property === 'newPassword',
      );
      expect(contrasenaError).toBeDefined();
    });

  
  /**
   *  RF-001.8
   *  CP-045 - Validación de la obligatoriedad de los campos
   */
  it('CP-045 - debe rechazar cuando faltan campos obligatorios', async () => {
    const dto = plainToInstance(ResetPasswordDto, {
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
    });

    const errores = await validate(dto);

    expect(errores.length).toBeGreaterThanOrEqual(4);

    const emailError = errores.find(error => error.property === 'email');
    const codeError = errores.find(error => error.property === 'code');
    const newPasswordError = errores.find(
      error => error.property === 'newPassword',
    );
    const confirmPasswordError = errores.find(
      error => error.property === 'confirmPassword',
    );

    expect(emailError).toBeDefined();
    expect(codeError).toBeDefined();
    expect(newPasswordError).toBeDefined();
    expect(confirmPasswordError).toBeDefined();
  });
});


  
  /**
   * RF-001.9
   * CP-047 - Verificar que el usuario pueda cerrar sesión correctamente
   */
  it('CP-047 - debe cerrar sesión correctamente', () => {
    const result = authService.logout();

    expect(result).toEqual({
      success: true,
      message: 'Sesion cerrada (token invalidado por el cliente)',
    });
  });




})
