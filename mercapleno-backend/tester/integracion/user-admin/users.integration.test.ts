const request = require('supertest');
const jwt = require('jsonwebtoken');
const { Test } = require('@nestjs/testing');
import type { INestApplication } from '@nestjs/common';
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('../../../src/app.module');
const { prisma, cleanDatabase, seedReferenceData } = require('../../test-utils');

const adminToken = jwt.sign(
  { sub: 1, id_rol: 1, email: 'admin@test.local', token_type: 'access' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' },
);

describe('Pruebas de integracion Admin', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  beforeEach(async () => {
    await cleanDatabase();
    await seedReferenceData();
    await prisma.usuarios.create({
      data: {
        id: 1,
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@test.local',
        password: 'not-used-in-this-test',
        direccion: 'Oficina de pruebas',
        fecha_nacimiento: new Date('1990-01-01'),
        id_rol: 1,
        id_tipo_identificacion: 1,
        numero_identificacion: '1000000001',
        email_verified: true,
      },
    });
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('crea un usuario administrativo y lo persiste en MySQL', async () => {
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
      .set('x-api-key', process.env.INTERNAL_API_KEY)
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      message: 'Usuario agregado correctamente',
    });

    const persistedUser = await prisma.usuarios.findUnique({
      where: { email: payload.email },
    });

    expect(persistedUser).toEqual(expect.objectContaining({
      nombre: payload.nombre,
      id_rol: payload.id_rol,
      numero_identificacion: payload.numero_identificacion,
      email_verified: true,
    }));
    expect(persistedUser.password).not.toBe(payload.password);
  });

  it('rechaza un correo duplicado usando la restricción del servicio y conserva un solo registro', async () => {
    const payload = {
      nombre: 'Otro',
      apellido: 'Administrador',
      email: 'admin@test.local',
      password: 'SecurePass123!',
      direccion: 'Otra dirección',
      fecha_nacimiento: '1985-08-20',
      id_rol: 2,
      id_tipo_identificacion: 1,
      numero_identificacion: '1234567891',
    };

    await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', process.env.INTERNAL_API_KEY)
      .send(payload)
      .expect(409);

    await expect(prisma.usuarios.count({ where: { email: payload.email } })).resolves.toBe(1);
  });
});
