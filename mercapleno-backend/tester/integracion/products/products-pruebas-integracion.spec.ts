import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../../src/app.module';
import { envs } from '../../../src/config';

const cookieParser = require('cookie-parser');
const request = require('supertest');
const { prisma, cleanDatabase, seedReferenceData, syncSequences } = require('../../test-utils');

describe('Productos - Pruebas de Integración con BD Real (e2e)', () => {
  let app: INestApplication;

  const tokenAdminValido = jwt.sign(
    { sub: 1, id_rol: 1, email: 'admin@mercapleno.local', token_type: 'access' },
    envs.jwtSecret || 'test-secret',
    { expiresIn: '1h' },
  );

  const tokenClienteSinPermiso = jwt.sign(
    { sub: 2, id_rol: 3, email: 'cliente@mercapleno.local', token_type: 'access' },
    envs.jwtSecret || 'test-secret',
    { expiresIn: '1h' },
  );

  beforeAll(async () => {
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

    // Sembrar dependencias foráneas necesarias para productos
    await prisma.categoria.create({
      data: {
        id_categoria: 1,
        nombre: 'Panadería',
      },
    });

    await prisma.proveedor.create({
      data: {
        id_proveedor: 1,
        nombre: 'Don Pancho',
        apellido: 'Panadería',
        telefono: '3001234567',
        activo: true,
      },
    });

    await syncSequences();
  });

  it('CP-046: POST /api/productos con datos válidos y token -> 201 y persiste en PostgreSQL', async () => {
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
      expect.objectContaining({
        message: 'Producto agregado correctamente',
        id: expect.any(Number),
      }),
    );

    // Verificar persistencia real en PostgreSQL
    const productoEnDb = await prisma.productos.findUnique({
      where: { id_productos: response.body.id },
    });
    expect(productoEnDb).toBeDefined();
    expect(productoEnDb?.nombre).toBe('Pan Frances');
    expect(Number(productoEnDb?.precio)).toBe(3500);
  });

  it('debe listar los productos persistidos mediante GET /api/productos (200 OK)', async () => {
    // Insertar un producto de prueba directamente
    await prisma.productos.create({
      data: {
        nombre: 'Baguette Tradicional',
        precio: 4000,
        id_categoria: 1,
        id_proveedor: 1,
        estado: 'Disponible',
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/productos')
      .set('Authorization', `Bearer ${tokenAdminValido}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0]).toHaveProperty('nombre', 'Baguette Tradicional');
    expect(response.body[0]).toHaveProperty('categoria_nombre', 'Panadería');
  });

  it('debe rechazar la creación si la categoría o proveedor foráneos no existen (400 Bad Request)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .send({
        nombre: 'Producto Sin Categoria',
        id_categoria: 9999,
        id_proveedor: 1,
        precio: 5000,
        estado: 'Disponible',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('no existen en la base de datos');
  });

  it('CP-047: POST /api/productos con caracteres especiales inválidos -> 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .send({
        nombre: 'Pan#@$123!',
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

  it('CP-048a: POST /api/productos sin token -> 401 Unauthorized', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .send({
        nombre: 'Pan Frances',
        id_categoria: 1,
        id_proveedor: 1,
        precio: 3500,
        estado: 'Disponible',
      });

    expect(response.status).toBe(401);
  });

  it('CP-048b: POST /api/productos con token de rol sin permisos -> 403 Forbidden', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenClienteSinPermiso}`)
      .send({
        nombre: 'Pan Frances',
        id_categoria: 1,
        id_proveedor: 1,
        precio: 3500,
        estado: 'Disponible',
      });

    expect(response.status).toBe(403);
  });
});