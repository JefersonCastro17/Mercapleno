import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import Database = require('better-sqlite3');
import * as path from 'path';
import * as fs from 'fs';

const request = require('supertest');

describe('Productos (e2e) con SQLite Real', () => {
  let app: INestApplication;
  let db: Database.Database;

  const tokenAdminValido = jwt.sign(
    { sub: 1, id_rol: 1, email: 'admin@mercapleno.com', token_type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' },
  );

  const tokenClienteSinPermiso = jwt.sign(
    { sub: 2, id_rol: 3, email: 'cliente@mercapleno.com', token_type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' },
  );

  // Prisma mock delegating to better-sqlite3 for realistic behavior
  const createPrismaMock = (db: Database.Database) => ({
    productos: {
      create: jest.fn().mockImplementation(async (args) => {
        const { nombre, precio, id_categoria, id_proveedor, descripcion, estado, imagen } = args.data;
        const stmt = db.prepare(`
          INSERT INTO productos (nombre, precio, id_categoria, id_proveedor, descripcion, estado, imagen)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(nombre, precio, id_categoria, id_proveedor, descripcion || null, estado, imagen || null);
        return {
          id_productos: Number(result.lastInsertRowid),
          ...args.data
        };
      }),
      findMany: jest.fn().mockImplementation(async () => {
        const stmt = db.prepare(`
          SELECT p.*, c.nombre as categoria_nombre, pr.nombre as pr_nombre, pr.apellido as pr_apellido 
          FROM productos p
          LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
          LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor
          ORDER BY p.id_productos ASC
        `);
        const rows = stmt.all();
        return rows.map((row: any) => ({
          ...row,
          categoria: row.categoria_nombre ? { nombre: row.categoria_nombre } : null,
          proveedor: row.pr_nombre ? { nombre: row.pr_nombre, apellido: row.pr_apellido } : null
        }));
      }),
      findUnique: jest.fn().mockImplementation(async (args) => {
        const id = args.where.id_productos;
        const stmt = db.prepare('SELECT * FROM productos WHERE id_productos = ?');
        return stmt.get(id);
      }),
      update: jest.fn().mockImplementation(async (args) => {
        const id = args.where.id_productos;
        const data = args.data;
        let setClauses = [];
        let params = [];
        for (const [key, value] of Object.entries(data)) {
          setClauses.push(`${key} = ?`);
          params.push(value);
        }
        params.push(id);
        const stmt = db.prepare(`UPDATE productos SET ${setClauses.join(', ')} WHERE id_productos = ?`);
        stmt.run(...params);
        return args.data;
      }),
      delete: jest.fn().mockImplementation(async (args) => {
        const id = args.where.id_productos;
        const stmt = db.prepare('DELETE FROM productos WHERE id_productos = ?');
        stmt.run(id);
        return { id_productos: id };
      })
    },
    categoria: {
      findMany: jest.fn().mockImplementation(async () => {
        const stmt = db.prepare('SELECT id_categoria, nombre FROM categoria ORDER BY nombre ASC');
        return stmt.all();
      })
    },
    proveedor: {
      findMany: jest.fn().mockImplementation(async () => {
        const stmt = db.prepare('SELECT id_proveedor, nombre, apellido FROM proveedor ORDER BY nombre ASC');
        return stmt.all();
      })
    },
    venta_productos: { deleteMany: jest.fn() },
    stock_actual: { deleteMany: jest.fn() },
    salida_productos: { deleteMany: jest.fn() },
    entrada_productos: { deleteMany: jest.fn() },
    devolver_productos: { deleteMany: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback({
        venta_productos: { deleteMany: jest.fn() },
        stock_actual: { deleteMany: jest.fn() },
        salida_productos: { deleteMany: jest.fn() },
        entrada_productos: { deleteMany: jest.fn() },
        devolver_productos: { deleteMany: jest.fn() },
        productos: {
          delete: jest.fn().mockImplementation(async (args) => {
            const id = args.where.id_productos;
            const stmt = db.prepare('DELETE FROM productos WHERE id_productos = ?');
            stmt.run(id);
            return { id_productos: id };
          })
        }
      });
    })
  });

  beforeAll(async () => {
    // 1. Setup in-memory SQLite Database
    db = new Database(':memory:');
    
    // 2. Load schema and seed
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const seedPath = path.join(__dirname, '../../db/seed.sql');
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    
    db.exec(schemaSql);
    db.exec(seedSql);

    // Insert minimal additional seed data needed for products tests
    db.exec(`
      INSERT INTO categoria (id_categoria, nombre) VALUES (1, 'Abarrotes'), (2, 'Lacteos');
      INSERT INTO proveedor (id_proveedor, nombre, apellido) VALUES (1, 'Juan', 'Perez');
      INSERT INTO productos (id_productos, nombre, precio, id_categoria, id_proveedor, estado) 
      VALUES (1, 'Leche Entera', 4500, 2, 1, 'Disponible');
    `);

    const prismaMock = createPrismaMock(db);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    db.close();
  });

  it('CP-046: POST /api/productos con datos válidos y token -> 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`)
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
    
    // Validate DB insertion
    const row = db.prepare("SELECT * FROM productos WHERE nombre = 'Pan Frances'").get() as any;
    expect(row).toBeDefined();
    expect(row.precio).toBe(3500);
  });

<<<<<<< HEAD

  it('CP-047: POST /api/productos con caracteres especiales inválidos -> 400', async () => {
=======
  it('CP-047: POST /api/productos con nombre que contiene números -> 400', async () => {
>>>>>>> origin/feature/pruebas-unitarias-integracion-products-reports
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`)
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

  it('CP-048a: POST /api/productos sin token -> 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .send({ nombre: 'Pan Frances', id_categoria: 1, id_proveedor: 1, precio: 3500, estado: 'Disponible' });

    expect(response.status).toBe(401);
  });

  it('CP-048b: POST /api/productos con token de rol sin permisos -> 403', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', \`Bearer \${tokenClienteSinPermiso}\`)
      .send({ nombre: 'Pan Frances', id_categoria: 1, id_proveedor: 1, precio: 3500, estado: 'Disponible' });

    expect(response.status).toBe(403);
  });

  it('CP-049: GET /api/productos -> 200 (Validates JOINs)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/productos')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`);
      
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
    // Verifies that relations are loaded
    expect(response.body[0]).toHaveProperty('categoria_nombre');
  });
  
  it('CP-050: PUT /api/productos/:id -> 200', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/productos/1')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`)
      .send({
        precio: 5000,
      });

    expect(response.status).toBe(200);
    const row = db.prepare("SELECT precio FROM productos WHERE id_productos = 1").get() as any;
    expect(row.precio).toBe(5000);
  });

  it('CP-051: DELETE /api/productos/:id -> 200', async () => {
    // Ensure product exists
    expect(db.prepare("SELECT * FROM productos WHERE id_productos = 1").get()).toBeDefined();

    const response = await request(app.getHttpServer())
      .delete('/api/productos/1')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`);

    expect(response.status).toBe(200);
    // Ensure product is deleted
    expect(db.prepare("SELECT * FROM productos WHERE id_productos = 1").get()).toBeUndefined();
  });
  
  it('CP-052: DELETE /api/productos/:id inexistente -> 404', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/productos/999')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`);

    expect(response.status).toBe(404);
  });
  
  it('CP-053: GET /api/productos/catalogos -> 200', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/productos/catalogos')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('categorias');
    expect(response.body).toHaveProperty('proveedores');
    expect(Array.isArray(response.body.categorias)).toBeTruthy();
  });
});