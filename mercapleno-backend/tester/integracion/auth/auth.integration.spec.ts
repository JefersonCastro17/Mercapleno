import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { EmailService } from '../../../src/email/email.service';

const cookieParser = require('cookie-parser');
const request = require('supertest');

describe('Módulo de Autenticación - Pruebas de Integración (e2e)', () => {
  let app: INestApplication;
  let emailServiceMock: Partial<EmailService>;

  // Simulación de base de datos en memoria para pruebas de integración con NestJS
  let usersDb: any[] = [];
  let docTypesDb: any[] = [
    { id: 1, nombre: 'Cédula de Ciudadanía', abreviatura: 'CC' },
    { id: 2, nombre: 'Tarjeta de Identidad', abreviatura: 'TI' },
  ];
  let rolesDb: any[] = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Empleado' },
    { id: 3, nombre: 'Cliente' },
  ];

  const hashCode = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

  const prismaMock = {
    tipos_identificacion: {
      findMany: jest.fn().mockImplementation(async () => docTypesDb),
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        return docTypesDb.find((d) => d.id === where.id) || null;
      }),
    },
    roles: {
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        return rolesDb.find((r) => r.id === where.id) || null;
      }),
    },
    usuarios: {
      findMany: jest.fn().mockImplementation(async () => usersDb),
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        let user = null;
        if (where.id) {
          user = usersDb.find((u) => u.id === where.id);
        } else if (where.email) {
          user = usersDb.find((u) => u.email === where.email.toLowerCase());
        }
        if (!user) return null;
        return {
          ...user,
          roles: rolesDb.find((r) => r.id === user.id_rol) || { id: user.id_rol, nombre: 'Rol' },
          tipos_identificacion: docTypesDb.find((d) => d.id === user.id_tipo_identificacion) || {
            id: user.id_tipo_identificacion,
            nombre: 'CC',
          },
        };
      }),
      create: jest.fn().mockImplementation(async ({ data }: any) => {
        const existing = usersDb.find((u) => u.email === data.email.toLowerCase());
        if (existing) {
          const error: any = new Error('Unique constraint failed');
          error.code = 'P2002';
          error.meta = { target: ['email'] };
          throw error;
        }
        const newUser = {
          id: usersDb.length + 1,
          ...data,
          email: data.email.toLowerCase(),
          creado_en: new Date(),
        };
        usersDb.push(newUser);
        return newUser;
      }),
      update: jest.fn().mockImplementation(async ({ where, data }: any) => {
        let index = -1;
        if (where.id) {
          index = usersDb.findIndex((u) => u.id === where.id);
        } else if (where.email) {
          index = usersDb.findIndex((u) => u.email === where.email.toLowerCase());
        }
        if (index === -1) {
          throw new Error('User not found');
        }
        usersDb[index] = { ...usersDb[index], ...data };
        const updated = usersDb[index];
        return {
          ...updated,
          roles: rolesDb.find((r) => r.id === updated.id_rol) || { id: updated.id_rol, nombre: 'Rol' },
          tipos_identificacion: docTypesDb.find((d) => d.id === updated.id_tipo_identificacion) || {
            id: updated.id_tipo_identificacion,
            nombre: 'CC',
          },
        };
      }),
    },
    intentos_login: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  };

  beforeAll(async () => {
    emailServiceMock = {
      sendVerificationCode: jest.fn().mockResolvedValue(undefined),
      sendLoginTwoFactorCode: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(EmailService)
      .useValue(emailServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    usersDb = [
      {
        id: 1,
        nombre: 'Admin',
        apellido: 'Mercapleno',
        email: 'admin@mercapleno.local',
        password: hashedPassword,
        direccion: 'Sede Principal',
        fecha_nacimiento: new Date('1990-01-01'),
        id_rol: 1,
        id_tipo_identificacion: 1,
        numero_identificacion: '1000000001',
        email_verified: true,
        email_verification_code: null,
        email_verification_expires: null,
        login_two_factor_code: null,
        login_two_factor_expires: null,
        password_reset_code: null,
        password_reset_expires: null,
      },
      {
        id: 2,
        nombre: 'Cliente',
        apellido: 'Registrado',
        email: 'cliente@test.local',
        password: hashedPassword,
        direccion: 'Calle 100 # 20-30',
        fecha_nacimiento: new Date('1995-05-15'),
        id_rol: 3,
        id_tipo_identificacion: 1,
        numero_identificacion: '1000000002',
        email_verified: true,
        email_verification_code: null,
        email_verification_expires: null,
        login_two_factor_code: null,
        login_two_factor_expires: null,
        password_reset_code: null,
        password_reset_expires: null,
      },
      {
        id: 3,
        nombre: 'No',
        apellido: 'Verificado',
        email: 'no.verificado@test.local',
        password: hashedPassword,
        direccion: 'Carrera 50 # 10-20',
        fecha_nacimiento: new Date('1998-08-08'),
        id_rol: 3,
        id_tipo_identificacion: 1,
        numero_identificacion: '1000000003',
        email_verified: false,
        email_verification_code: hashCode('123456'),
        email_verification_expires: new Date(Date.now() + 60 * 60 * 1000),
        login_two_factor_code: null,
        login_two_factor_expires: null,
        password_reset_code: null,
        password_reset_expires: null,
      },
    ];
  });

  // =========================================================================
  // 1. OBTENER TIPOS DE DOCUMENTO
  // =========================================================================
  describe('GET /api/auth/document-types', () => {
    it('debe retornar lista de tipos de identificación disponibles (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/document-types');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.tipos_identificacion)).toBe(true);
      expect(res.body.tipos_identificacion).toHaveLength(2);
      expect(res.body.tipos_identificacion[0]).toHaveProperty('abreviatura', 'CC');
    });
  });

  // =========================================================================
  // 2. REGISTRO DE USUARIOS
  // =========================================================================
  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario y enviar código de verificación (201 Created)', async () => {
      const payload = {
        nombre: 'Nuevo',
        apellido: 'Usuario',
        email: 'nuevo.usuario@test.local',
        password: 'Password123!',
        direccion: 'Avenida Siempre Viva 742',
        fecha_nacimiento: '1996-03-20',
        id_tipo_identificacion: 1,
        numero_identificacion: '1000000099',
      };

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.requiresVerification).toBe(true);
      expect(emailServiceMock.sendVerificationCode).toHaveBeenCalledWith(
        'nuevo.usuario@test.local',
        expect.any(String),
        expect.any(Number),
      );

      const created = usersDb.find((u) => u.email === 'nuevo.usuario@test.local');
      expect(created).toBeDefined();
      expect(created.email_verified).toBe(false);
    });

    it('debe rechazar registro con correo duplicado (409 Conflict)', async () => {
      const payload = {
        nombre: 'Duplicado',
        apellido: 'Email',
        email: 'cliente@test.local',
        password: 'Password123!',
        direccion: 'Calle 1',
        fecha_nacimiento: '1995-01-01',
        id_tipo_identificacion: 1,
        numero_identificacion: '1000000099',
      };

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('El correo electronico ya esta registrado');
    });

    it('debe rechazar registro con payload inválido (400 Bad Request)', async () => {
      const payloadInvalido = {
        nombre: 'Incompleto',
        email: 'correo-no-valido',
        password: '123',
      };

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payloadInvalido);

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 3. VERIFICACIÓN DE EMAIL
  // =========================================================================
  describe('POST /api/auth/verify-email', () => {
    it('debe verificar exitosamente el email con código correcto (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({
          email: 'no.verificado@test.local',
          code: '123456',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Correo verificado correctamente');

      const user = usersDb.find((u) => u.email === 'no.verificado@test.local');
      expect(user.email_verified).toBe(true);
      expect(user.email_verification_code).toBeNull();
    });

    it('debe rechazar verificación con código incorrecto (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({
          email: 'no.verificado@test.local',
          code: '999999',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('incorrecto');
    });

    it('debe rechazar verificación cuando el código ha expirado (400 Bad Request)', async () => {
      const user = usersDb.find((u) => u.email === 'no.verificado@test.local');
      user.email_verification_expires = new Date(Date.now() - 1000);

      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({
          email: 'no.verificado@test.local',
          code: '123456',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('expirado');
    });

    it('debe responder 201 informativo si el correo ya está verificado', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({
          email: 'cliente@test.local',
          code: '123456',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('ya esta verificado');
    });
  });

  // =========================================================================
  // 4. REENVÍO DE VERIFICACIÓN
  // =========================================================================
  describe('POST /api/auth/resend-verification', () => {
    it('debe reenviar código de verificación para usuario no verificado (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/resend-verification')
        .send({ email: 'no.verificado@test.local' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(emailServiceMock.sendVerificationCode).toHaveBeenCalledWith(
        'no.verificado@test.local',
        expect.any(String),
        expect.any(Number),
      );
    });

    it('debe responder 404 si el usuario no existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/resend-verification')
        .send({ email: 'fantasma@test.local' });

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 5. INICIO DE SESIÓN (LOGIN)
  // =========================================================================
  describe('POST /api/auth/login', () => {
    it('debe rechazar el login con credenciales incorrectas (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'cliente@test.local',
          password: 'PasswordErroneo!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Contrasena incorrecta');
    });

    it('debe rechazar el login de usuario sin email verificado (403 EMAIL_NOT_VERIFIED)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'no.verificado@test.local',
          password: 'Password123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('debe iniciar sesión para cliente común (Rol 3) retornando token y cookie (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'cliente@test.local',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('cliente@test.local');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('access_token'))).toBe(true);
    });

    it('debe requerir segundo factor (2FA) para Administrador (Rol 1) y devolver pendingToken (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@mercapleno.local',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.requiresTwoFactor).toBe(true);
      expect(res.body.pendingToken).toBeDefined();
      expect(emailServiceMock.sendLoginTwoFactorCode).toHaveBeenCalledWith(
        'admin@mercapleno.local',
        expect.any(String),
        expect.any(Number),
        'Administrador',
      );

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeUndefined();
    });
  });

  // =========================================================================
  // 6. VERIFICACIÓN DE CÓDIGO 2FA
  // =========================================================================
  describe('POST /api/auth/verify-login-code', () => {
    it('debe completar login 2FA con pendingToken y código correcto (200 OK)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@mercapleno.local',
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(200);
      const pendingToken = loginRes.body.pendingToken;
      const sentCode = (emailServiceMock.sendLoginTwoFactorCode as jest.Mock).mock.calls[0][1];

      const verifyRes = await request(app.getHttpServer())
        .post('/api/auth/verify-login-code')
        .send({
          pendingToken,
          code: sentCode,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.token).toBeDefined();
      expect(verifyRes.body.user.email).toBe('admin@mercapleno.local');

      const cookies = verifyRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('access_token'))).toBe(true);
    });

    it('debe rechazar código 2FA erróneo (403 Forbidden)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@mercapleno.local',
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(200);
      const pendingToken = loginRes.body.pendingToken;

      const verifyRes = await request(app.getHttpServer())
        .post('/api/auth/verify-login-code')
        .send({
          pendingToken,
          code: '000000',
        });

      expect(verifyRes.status).toBe(403);
      expect(verifyRes.body.success).toBe(false);
      expect(verifyRes.body.message).toContain('incorrecto');
    });

    it('debe rechazar pendingToken manipulado / inválido (401 Unauthorized)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-login-code')
        .send({
          pendingToken: 'invalid.token.payload',
          code: '123456',
        });

      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 7. RECUPERACIÓN Y RESET DE CONTRASEÑA
  // =========================================================================
  describe('Flujo de Recuperación de Contraseña', () => {
    it('debe solicitar código de recuperación para usuario registrado (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/request-password-reset')
        .send({ email: 'cliente@test.local' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(emailServiceMock.sendPasswordResetCode).toHaveBeenCalledWith(
        'cliente@test.local',
        expect.any(String),
        expect.any(Number),
      );
    });

    it('debe responder 201 genérico al solicitar recuperación con email no existente', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/request-password-reset')
        .send({ email: 'inexistente@test.local' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(emailServiceMock.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('debe resetear la contraseña exitosamente con código correcto (201 Created)', async () => {
      const resetReq = await request(app.getHttpServer())
        .post('/api/auth/request-password-reset')
        .send({ email: 'cliente@test.local' });
      expect(resetReq.status).toBe(201);

      const sentCode = (emailServiceMock.sendPasswordResetCode as jest.Mock).mock.calls[0][1];

      const res = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          email: 'cliente@test.local',
          code: sentCode,
          newPassword: 'NuevaPassword456!',
          confirmPassword: 'NuevaPassword456!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Contrasena actualizada correctamente');

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'cliente@test.local',
          password: 'NuevaPassword456!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
    });

    it('debe rechazar reset cuando las contraseñas no coinciden (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          email: 'cliente@test.local',
          code: '123456',
          newPassword: 'NuevaPassword456!',
          confirmPassword: 'DiferentePassword456!',
        });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 8. CIERRE DE SESIÓN (LOGOUT)
  // =========================================================================
  describe('POST /api/auth/logout', () => {
    it('debe limpiar la cookie de sesión y retornar 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('access_token=;'))).toBe(true);
    });
  });
});
