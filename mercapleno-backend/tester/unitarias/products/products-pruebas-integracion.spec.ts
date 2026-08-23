

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../app.module';

const request = require('supertest');
import { PrismaService } from '../prisma/prisma.service';

describe('Productos (e2e)', () => {
  let app: INestApplication;


  const prismaMock = {
    productos: {
      create: jest.fn().mockResolvedValue({
        id: 1,
        nombre: 'Pan Frances',
        precio: 3500,
        stock: 20,
        estado: 'ACTIVO',
      }),
    },
  };

 
  const tokenAdminValido = jwt.sign(
    { sub: 1, id_rol: 1, email: 'admin@mercapleno.com', token_type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' },
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    // Se replica la misma configuración global que en main.ts
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('CP-046: POST /api/productos con datos válidos y token -> 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .send({
        nombre: 'Pan Frances',
        id_categoria: 1,
        id_proveedor: 1,
        precio: 3500,
        estado: 'Disponible',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({ message: 'Producto agregado correctamente' }),
    );
  });


  it('CP-047: POST /api/productos con nombre que contiene números -> 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .send({
        nombre: 'Pan123',
        id_categoria: 1,
        id_proveedor: 1,
        precio: 3500,
        estado: 'Disponible',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('nombre')]),
    );
  });

  
  it('CP-048a: POST /api/productos sin token -> 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .send({ nombre: 'Pan Frances', id_categoria: 1, id_proveedor: 1, precio: 3500, estado: 'Disponible' });

    expect(response.status).toBe(401);
  });

  it('CP-048b: POST /api/productos con token de rol sin permisos -> 403', async () => {
    const tokenClienteSinPermiso = jwt.sign(
      { sub: 2, id_rol: 3, email: 'cliente@mercapleno.com', token_type: 'access' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    );

    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenClienteSinPermiso}`)
      .send({ nombre: 'Pan Frances', id_categoria: 1, id_proveedor: 1, precio: 3500, estado: 'Disponible' });

    expect(response.status).toBe(403);
  });
});