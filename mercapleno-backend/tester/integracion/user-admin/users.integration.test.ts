import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../../src/app.module';
import { envs } from '../../../src/config';

const request = require('supertest');
const { prisma, cleanDatabase, seedReferenceData } = require('../../test-utils');

describe('Módulo User-Admin - Pruebas de Integración con BD Real (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let clientToken: string;
  const apiKey = envs.internalApiKey || 'test-internal-key';

  beforeAll(async () => {
    adminToken = jwt.sign(
      { sub: 1, id_rol: 1, email: 'admin@test.local', token_type: 'access' },
      envs.jwtSecret || 'test-secret',
      { expiresIn: '1h' },
    );

    clientToken = jwt.sign(
      { sub: 2, id_rol: 3, email: 'cliente@test.local', token_type: 'access' },
      envs.jwtSecret || 'test-secret',
      { expiresIn: '1h' },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
    await seedReferenceData();

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await prisma.usuarios.createMany({
      data: [
        {
          id: 1,
          nombre: 'Admin',
          apellido: 'Principal',
          email: 'admin@test.local',
          password: hashedPassword,
          direccion: 'Oficina Central',
          fecha_nacimiento: new Date('1990-01-01'),
          id_rol: 1,
          id_tipo_identificacion: 1,
          numero_identificacion: '1000000001',
          email_verified: true,
        },
        {
          id: 2,
          nombre: 'Carlos',
          apellido: 'Empleado',
          email: 'carlos.empleado@test.local',
          password: hashedPassword,
          direccion: 'Sucursal Norte',
          fecha_nacimiento: new Date('1992-05-10'),
          id_rol: 2,
          id_tipo_identificacion: 1,
          numero_identificacion: '1000000002',
          email_verified: true,
        },
      ],
    });
  });



  it('debe listar todos los usuarios administrativos desde la BD (200 OK)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.usuarios)).toBe(true);
    expect(res.body.usuarios.length).toBe(2);
    expect(res.body.usuarios[0]).toHaveProperty('email', 'admin@test.local');
  });

  it('debe filtrar usuarios usando parámetro search (200 OK)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users?search=Carlos')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.usuarios.length).toBe(1);
    expect(res.body.usuarios[0].nombre).toBe('Carlos');
  });
});



describe('GET /api/admin/users/roles', () => {
  it('debe listar los roles configurados en la BD (200 OK)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.roles)).toBe(true);
    expect(res.body.roles.length).toBe(3);
  });
});



describe('GET /api/admin/users/:id', () => {
  it('debe retornar los datos del usuario solicitado por ID (200 OK)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.usuario).toHaveProperty('id', 2);
    expect(res.body.usuario).toHaveProperty('email', 'carlos.empleado@test.local');
  });

  it('debe responder 404 si el usuario no existe en la BD', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('debe responder 400 si el ID es inválido', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('invalido');
  });
});



describe('POST /api/admin/users', () => {
  it('debe crear un nuevo usuario y persistirlo en la base de datos (201 Created)', async () => {
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

    const res = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Usuario agregado correctamente');

    const persistedUser = await prisma.usuarios.findUnique({
      where: { email: payload.email },
    });
    expect(persistedUser).toBeDefined();
    expect(persistedUser.nombre).toBe(payload.nombre);
    expect(persistedUser.id_rol).toBe(payload.id_rol);

    const passwordMatches = await bcrypt.compare(payload.password, persistedUser.password);
    expect(passwordMatches).toBe(true);
  });

  it('debe rechazar la creación si el correo ya existe (409 Conflict)', async () => {
    const payload = {
      nombre: 'Duplicado',
      apellido: 'Test',
      email: 'admin@test.local',
      password: 'SecurePass123!',
      direccion: 'Calle 1',
      fecha_nacimiento: '1990-01-01',
      id_rol: 2,
      id_tipo_identificacion: 1,
      numero_identificacion: '9999999999',
    };

    const res = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('correo electronico ya esta registrado');
  });

  it('debe rechazar la creación si el número de identificación ya existe (409 Conflict)', async () => {
    const payload = {
      nombre: 'Duplicado Doc',
      apellido: 'Test',
      email: 'nuevo.correo@test.local',
      password: 'SecurePass123!',
      direccion: 'Calle 2',
      fecha_nacimiento: '1990-01-01',
      id_rol: 2,
      id_tipo_identificacion: 1,
      numero_identificacion: '1000000001',
    };

    const res = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('numero de identificacion ya esta registrado');
  });
});



describe('PATCH & PUT /api/admin/users/:id', () => {
  it('debe actualizar los datos del usuario en la base de datos con PATCH (200 OK)', async () => {
    const updatePayload = {
      nombre: 'Carlos Modificado',
      direccion: 'Nueva Direccion 789',
    };

    const res = await request(app.getHttpServer())
      .patch('/api/admin/users/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await prisma.usuarios.findUnique({ where: { id: 2 } });
    expect(updatedUser.nombre).toBe('Carlos Modificado');
    expect(updatedUser.direccion).toBe('Nueva Direccion 789');
  });

  it('debe soportar actualización vía PUT (200 OK)', async () => {
    const updatePayload = {
      nombre: 'Carlos PUT',
    };

    const res = await request(app.getHttpServer())
      .put('/api/admin/users/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await prisma.usuarios.findUnique({ where: { id: 2 } });
    expect(updatedUser.nombre).toBe('Carlos PUT');
  });

  it('debe rechazar actualización si el nuevo correo pertenece a otro usuario (409 Conflict)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/admin/users/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey)
      .send({ email: 'admin@test.local' });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('correo electronico ya esta registrado');
  });
});



describe('DELETE /api/admin/users/:id', () => {
  it('debe eliminar el usuario de la base de datos (200 OK)', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/admin/users/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('eliminado correctamente');

    const deletedUser = await prisma.usuarios.findUnique({ where: { id: 2 } });
    expect(deletedUser).toBeNull();
  });

  it('debe responder 404 al intentar eliminar un usuario inexistente', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/admin/users/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(404);
  });
});



describe('Seguridad y Guards', () => {
  it('debe rechazar con 401 si no se envía clave API (x-api-key)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(401);
  });

  it('debe rechazar con 401 si no se envía token Bearer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('x-api-key', apiKey);

    expect(res.status).toBe(401);
  });

  it('debe rechazar con 403 si el usuario autenticado no tiene rol de Administrador', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${clientToken}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(403);
  });
});

