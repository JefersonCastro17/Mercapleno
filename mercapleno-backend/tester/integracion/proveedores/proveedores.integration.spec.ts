import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../../src/app.module';
import { envs } from '../../../src/config';

const cookieParser = require('cookie-parser');
const request = require('supertest');
const { prisma, cleanDatabase, seedReferenceData, syncSequences } = require('../../test-utils');

describe('Módulo Proveedores - Pruebas de Integración con BD Real (e2e)', () => {
  let app: INestApplication;

  const adminToken = jwt.sign(
    { sub: 1, id_rol: 1, email: 'admin@mercapleno.local', token_type: 'access' },
    envs.jwtSecret || 'test-secret',
    { expiresIn: '1h' },
  );

  const clienteToken = jwt.sign(
    { sub: 2, id_rol: 3, email: 'cliente@test.local', token_type: 'access' },
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
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
    await seedReferenceData();

    // Proveedores base en PostgreSQL
    await prisma.proveedor.createMany({
      data: [
        {
          id_proveedor: 1,
          nombre: 'Alquería',
          apellido: 'S.A.',
          telefono: '3001112233',
          activo: true,
        },
        {
          id_proveedor: 2,
          nombre: 'Bimbo',
          apellido: 'Colombia',
          telefono: '3004445566',
          activo: true,
        },
        {
          id_proveedor: 3,
          nombre: 'Inactivo',
          apellido: 'Compañía',
          telefono: '3008889900',
          activo: false,
        },
      ],
    });

    // Crear categoría y un producto asociado al proveedor 1 para validar la relación y restricciones
    await prisma.categoria.create({
      data: {
        id_categoria: 1,
        nombre: 'Lácteos',
      },
    });

    await prisma.productos.create({
      data: {
        id_productos: 1,
        nombre: 'Leche Entera 1L',
        precio: 3500,
        id_categoria: 1,
        id_proveedor: 1,
        estado: 'Disponible',
      },
    });

    await syncSequences();
  });

  // =========================================================================
  // 1. GET /api/proveedores (Público - Solo activos)
  // =========================================================================
  describe('GET /api/proveedores (Público)', () => {
    it('debe retornar 200 y listar únicamente proveedores activos', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/proveedores');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.proveedores)).toBe(true);
      expect(res.body.proveedores).toHaveLength(2);
      expect(res.body.proveedores.every((p: any) => p.activo === true)).toBe(true);
    });

    it('debe filtrar proveedores por búsqueda ?search=', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/proveedores?search=Bimbo');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.proveedores).toHaveLength(1);
      expect(res.body.proveedores[0].nombre).toBe('Bimbo');
    });
  });

  // =========================================================================
  // 2. GET /api/proveedores/admin (Solo Admin - Activos e Inactivos)
  // =========================================================================
  describe('GET /api/proveedores/admin (Admin)', () => {
    it('debe retornar 401 si no se envía token de autenticación', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/proveedores/admin');

      expect(res.status).toBe(401);
    });

    it('debe retornar 403 si el usuario no tiene rol Administrador (Rol 1)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/proveedores/admin')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });

    it('debe retornar 200 y todos los proveedores (activos e inactivos) con token de Admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/proveedores/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.proveedores).toHaveLength(3);
    });
  });

  // =========================================================================
  // 3. GET /api/proveedores/:id (Público)
  // =========================================================================
  describe('GET /api/proveedores/:id', () => {
    it('debe retornar 200 y el detalle del proveedor solicitado', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/proveedores/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.proveedor.id).toBe(1);
      expect(res.body.proveedor.nombre).toBe('Alquería');
      expect(res.body.proveedor.total_productos).toBe(1);
    });

    it('debe retornar 404 si el proveedor no existe', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/proveedores/999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Proveedor no encontrado');
    });

    it('debe retornar 400 si el ID es inválido', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/proveedores/invalido');

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 4. POST /api/proveedores (Creación - Solo Admin)
  // =========================================================================
  describe('POST /api/proveedores', () => {
    it('debe retornar 401 si no se envía token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/proveedores')
        .send({ nombre: 'Test', apellido: 'Test', telefono: '3001234567' });

      expect(res.status).toBe(401);
    });

    it('debe retornar 403 si el rol no es Admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ nombre: 'Test', apellido: 'Test', telefono: '3001234567' });

      expect(res.status).toBe(403);
    });

    it('debe crear un nuevo proveedor correctamente en la BD (201 Created)', async () => {
      const payload = {
        nombre: 'Postobon',
        apellido: 'Distribuciones',
        telefono: '3005557788',
      };

      const res = await request(app.getHttpServer())
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Proveedor creado correctamente');
      expect(res.body.proveedor).toHaveProperty('id');
      expect(res.body.proveedor.nombre).toBe('Postobon');

      const creado = await prisma.proveedor.findFirst({ where: { nombre: 'Postobon' } });
      expect(creado).toBeDefined();
      expect(creado?.telefono).toBe('3005557788');
    });

    it('debe rechazar la creación si el teléfono ya está registrado (409 Conflict)', async () => {
      const payload = {
        nombre: 'Duplicado',
        apellido: 'Teléfono',
        telefono: '3001112233',
      };

      const res = await request(app.getHttpServer())
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('número de teléfono');
    });

    it('debe rechazar la creación con payload inválido (400 Bad Request)', async () => {
      const payloadInvalido = {
        nombre: '',
        telefono: '123',
      };

      const res = await request(app.getHttpServer())
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadInvalido);

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 5. PATCH /api/proveedores/:id (Actualización - Solo Admin)
  // =========================================================================
  describe('PATCH /api/proveedores/:id', () => {
    it('debe actualizar los datos del proveedor correctamente en la BD (200 OK)', async () => {
      const payload = {
        nombre: 'Alquería Modificada',
        telefono: '3109998877',
      };

      const res = await request(app.getHttpServer())
        .patch('/api/proveedores/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Proveedor actualizado correctamente');

      const actualizado = await prisma.proveedor.findUnique({ where: { id_proveedor: 1 } });
      expect(actualizado?.nombre).toBe('Alquería Modificada');
      expect(actualizado?.telefono).toBe('3109998877');
    });

    it('debe retornar 404 al intentar actualizar un proveedor inexistente', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/proveedores/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Nuevo Nombre' });

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 6. PATCH /api/proveedores/:id/deshabilitar & /habilitar
  // =========================================================================
  describe('PATCH /api/proveedores/:id/deshabilitar y /habilitar', () => {
    it('debe deshabilitar un proveedor activo en la BD (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/proveedores/1/deshabilitar')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Proveedor deshabilitado correctamente');

      const prov = await prisma.proveedor.findUnique({ where: { id_proveedor: 1 } });
      expect(prov?.activo).toBe(false);
    });

    it('debe habilitar un proveedor inactivo en la BD (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/proveedores/3/habilitar')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Proveedor habilitado correctamente');

      const prov = await prisma.proveedor.findUnique({ where: { id_proveedor: 3 } });
      expect(prov?.activo).toBe(true);
    });
  });

  // =========================================================================
  // 7. DELETE /api/proveedores/:id (Eliminación física - Solo Admin)
  // =========================================================================
  describe('DELETE /api/proveedores/:id', () => {
    it('debe rechazar la eliminación con 409 si el proveedor tiene productos asociados', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/proveedores/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('producto(s) asociado(s)');

      const prov = await prisma.proveedor.findUnique({ where: { id_proveedor: 1 } });
      expect(prov).toBeDefined();
    });

    it('debe eliminar físicamente el proveedor si no tiene productos asociados (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/proveedores/2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Proveedor eliminado correctamente');

      const eliminado = await prisma.proveedor.findUnique({ where: { id_proveedor: 2 } });
      expect(eliminado).toBeNull();
    });

    it('debe retornar 404 al intentar eliminar un proveedor inexistente', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/proveedores/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
