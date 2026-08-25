import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { envs } from '../../../src/config';

const request = require('supertest');

describe('Pruebas de integracion Admin Users', () => {
  let app: INestApplication;
  let adminToken: string;
  const usersDb: any[] = [];

  const mockPrismaService = {
    roles: {
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where.id === 1) return { id: 1, nombre: 'Admin' };
        if (where.id === 2) return { id: 2, nombre: 'Empleado' };
        return null;
      }),
      findMany: jest.fn().mockResolvedValue([
        { id: 1, nombre: 'Admin' },
        { id: 2, nombre: 'Empleado' },
      ]),
    },
    tipos_identificacion: {
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where.id === 1) return { id: 1, nombre: 'Cedula' };
        return null;
      }),
      findMany: jest.fn().mockResolvedValue([
        { id: 1, nombre: 'Cedula' },
      ]),
    },
    usuarios: {
      findFirst: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.email) {
          return Promise.resolve(usersDb.find((u) => u.email === where.email) || null);
        }
        if (where?.numero_identificacion) {
          return Promise.resolve(
            usersDb.find((u) => u.numero_identificacion === where.numero_identificacion) || null,
          );
        }
        if (where?.id !== undefined) {
          return Promise.resolve(usersDb.find((u) => u.id === where.id) || null);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.email) {
          return Promise.resolve(usersDb.find((u) => u.email === where.email) || null);
        }
        if (where?.numero_identificacion) {
          return Promise.resolve(
            usersDb.find((u) => u.numero_identificacion === where.numero_identificacion) || null,
          );
        }
        if (where?.id !== undefined) {
          return Promise.resolve(usersDb.find((u) => u.id === where.id) || null);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve(
          usersDb.map((u) => ({
            ...u,
            roles: { nombre: u.id_rol === 1 ? 'Admin' : 'Empleado' },
            tipos_identificacion: { nombre: 'Cedula' },
          })),
        );
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const newUser = {
          id: usersDb.length + 1,
          ...data,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date(),
        };
        usersDb.push(newUser);
        return Promise.resolve(newUser);
      }),
      count: jest.fn().mockImplementation(({ where }: any) => {
        if (where && where.email) {
          return Promise.resolve(usersDb.filter((u) => u.email === where.email).length);
        }
        return Promise.resolve(usersDb.length);
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const index = usersDb.findIndex((u) => u.id === where.id);
        if (index === -1) return Promise.resolve(null);
        usersDb[index] = { ...usersDb[index], ...data };
        return Promise.resolve(usersDb[index]);
      }),
      delete: jest.fn().mockImplementation(({ where }: any) => {
        const index = usersDb.findIndex((u) => u.id === where.id);
        if (index === -1) return Promise.resolve(null);
        const [deleted] = usersDb.splice(index, 1);
        return Promise.resolve(deleted);
      }),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    adminToken = jwt.sign(
      { sub: 1, id_rol: 1, email: 'admin@test.local', token_type: 'access' },
      envs.jwtSecret || 'test-secret',
      { expiresIn: '1h' },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  beforeEach(() => {
    usersDb.length = 0;
    usersDb.push({
      id: 1,
      nombre: 'Admin',
      apellido: 'Test',
      email: 'admin@test.local',
      password: 'hashed-password-123',
      direccion: 'Oficina de pruebas',
      fecha_nacimiento: new Date('1990-01-01'),
      id_rol: 1,
      id_tipo_identificacion: 1,
      numero_identificacion: '1000000001',
      email_verified: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea un usuario administrativo correctamente (201 Created)', async () => {
    const payload = {
      nombre: 'Pedro',
      apellido: 'Picapiedra',
      email: 'pedro.integration@test.local',
      password: 'SecurePass123!',
      direccion: 'Piedradura 456',
      fecha_nacimiento: '1985-08-20',
      id_rol: 2,
      id_tipo_identificacion: 1,
      numero_identificacion: '1234567890',
    };

    const response = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', envs.internalApiKey)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      message: 'Usuario agregado correctamente',
    });

    const persistedUser = usersDb.find((u) => u.email === payload.email);
    expect(persistedUser).toBeDefined();
    expect(persistedUser.nombre).toBe(payload.nombre);
    expect(persistedUser.id_rol).toBe(payload.id_rol);
  });

  it('rechaza la creacion si el correo ya esta registrado (409 Conflict)', async () => {
    const payload = {
      nombre: 'Otro',
      apellido: 'Administrador',
      email: 'admin@test.local',
      password: 'SecurePass123!',
      direccion: 'Otra direccion',
      fecha_nacimiento: '1985-08-20',
      id_rol: 2,
      id_tipo_identificacion: 1,
      numero_identificacion: '1234567891',
    };

    const response = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', envs.internalApiKey)
      .send(payload);

    expect(response.status).toBe(409);
    expect(usersDb.filter((u) => u.email === payload.email)).toHaveLength(1);
  });

  it('rechaza la peticion con 401 si no se envia clave API', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(401);
  });
});
