<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../../src/app.module';
import { MysqlService } from '../../../src/common/database/mysql.service';

const request = require('supertest');

describe('Reportes (e2e)', () => {
  let app: INestApplication;

  const tokenAdminValido = jwt.sign(
    { sub: 1, id_rol: 1, email: 'admin@mercapleno.com', token_type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' },
  );

  const mockMysqlService = {
    query: jest.fn(),
  } as any as MysqlService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MysqlService)
      .useValue(mockMysqlService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/sales/reports/ventas-mes -> 200 array', async () => {
    const rows = [{ mes: '2026-01', total: 100 }];
    (mockMysqlService.query as jest.Mock).mockResolvedValueOnce([rows]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/ventas-mes')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.body).toEqual(rows);
  });

  it('GET /api/sales/reports/top-productos -> 200 array', async () => {
    const rows = [{ nombre: 'P1', total_vendido: 3, total_facturado: 300 }];
    (mockMysqlService.query as jest.Mock).mockResolvedValueOnce([rows]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/top-productos')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.body).toEqual(rows);
  });

  it('GET /api/sales/reports/resumen -> 200 object', async () => {
    const resumenRow = { total_ventas: 5, dinero_total: '1500.00', promedio: '300.00' };
    (mockMysqlService.query as jest.Mock).mockResolvedValueOnce([[resumenRow]]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/resumen')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.body).toEqual(resumenRow);
  });

  it('GET /api/sales/reports/resumen-mes -> 200 array', async () => {
    const rows = [{ mes: '2026-01', cantidad_ventas: 2, total_mes: '700.00' }];
    (mockMysqlService.query as jest.Mock).mockResolvedValueOnce([rows]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/resumen-mes')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.body).toEqual(rows);
  });

  it('GET /api/sales/reports/pdf-resumen -> application/pdf', async () => {
    const mockVentas = [{ total_ventas: 2, ingresos_totales: 700, ticket_promedio: 350, costo_estimado: 490 }];
    const mockInv = [{ unidades_stock_total: 20, valor_inventario_venta: 200000, valor_inventario_costo: 140000, productos_stock_bajo: 1 }];
    const topRentables = [{ id_productos: 1, nombre: 'Prod A', categoria: 'General', unidades_vendidas: 2, total_facturado: 700, ganancia_total: 210, margen_pct: 30 }];
    const ventasCat = [{ categoria: 'Lácteos', unidades_vendidas: 5, total_ingresos: 50000 }];
    const resumenMes = [{ mes: '2026-01', cantidad_ventas: 2, total_mes: '700.00' }];

    (mockMysqlService.query as jest.Mock)
      .mockResolvedValueOnce([[mockVentas[0]]])
      .mockResolvedValueOnce([[mockInv[0]]])
      .mockResolvedValueOnce([topRentables])
      .mockResolvedValueOnce([ventasCat])
      .mockResolvedValueOnce([resumenMes]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/pdf-resumen')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('reporte_ventas');
    expect(res.body).toBeDefined();
  }, 10000);

  it('GET /api/sales/reports/financial-summary -> 200 object with profit and inventory', async () => {
    const mockVentas = [{ total_ventas: 10, ingresos_totales: 250000, ticket_promedio: 25000, costo_estimado: 175000 }];
    const mockInv = [{ unidades_stock_total: 50, valor_inventario_venta: 500000, valor_inventario_costo: 350000, productos_stock_bajo: 2 }];

    (mockMysqlService.query as jest.Mock)
      .mockResolvedValueOnce([[mockVentas[0]]])
      .mockResolvedValueOnce([[mockInv[0]]]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/financial-summary')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.body.ingresos_totales).toBe(250000);
    expect(res.body.ganancia_bruta).toBe(75000);
    expect(res.body.margen_porcentaje).toBe(30);
    expect(res.body.inventario.unidades_stock_total).toBe(50);
  });

  it('GET /api/sales/reports/ventas-categoria -> 200 array', async () => {
    const rows = [{ categoria: 'Lácteos', unidades_vendidas: 15, total_ingresos: 75000 }];
    (mockMysqlService.query as jest.Mock).mockResolvedValueOnce([rows]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/ventas-categoria')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.body).toEqual(rows);
  });

  it('GET /api/sales/reports/ventas-metodo -> 200 array', async () => {
    const rows = [{ metodo: 'Efectivo', transacciones: 8, total_recaudado: 120000 }];
    (mockMysqlService.query as jest.Mock).mockResolvedValueOnce([rows]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/ventas-metodo')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.body).toEqual(rows);
  });

  it('GET /api/sales/reports/productos-rentabilidad -> 200 array', async () => {
    const rows = [{ id_productos: 1, nombre: 'Arroz', categoria: 'Granos', unidades_vendidas: 20, total_facturado: 60000, ganancia_total: 18000, margen_pct: 30 }];
    (mockMysqlService.query as jest.Mock).mockResolvedValueOnce([rows]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/productos-rentabilidad')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.body).toEqual(rows);
  });
});
=======
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../../src/app.module';
import { MysqlService } from '../../../src/common/database/mysql.service';
import Database = require('better-sqlite3');
import * as path from 'path';
import * as fs from 'fs';

const request = require('supertest');

describe('Reportes (e2e) con SQLite Real', () => {
  let app: INestApplication;
  let db: Database.Database;

  const tokenAdminValido = jwt.sign(
    { sub: 1, id_rol: 1, email: 'admin@mercapleno.com', token_type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' },
  );

  const mockMysqlService = {
    query: jest.fn().mockImplementation(async (sql: string, params: any[] = []) => {
      // Basic SQL dialect translation from MySQL to SQLite
      let sqliteSql = sql;
      // Convert DATE_FORMAT(fecha, '%Y-%m') to strftime('%Y-%m', fecha)
      sqliteSql = sqliteSql.replace(/DATE_FORMAT\(([^,]+),\s*'%Y-%m'\)/g, "strftime('%Y-%m', $1)");
      
      const stmt = db.prepare(sqliteSql);
      const rows = stmt.all(...params);
      return [rows]; // Return format [rows, fields]
    }),
  } as any as MysqlService;

  beforeAll(async () => {
    // 1. Setup in-memory SQLite Database
    db = new Database(':memory:');
    
    // 2. Load schema and seed
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const seedPath = path.join(__dirname, '../db/seed.sql');
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    
    db.exec(schemaSql);
    db.exec(seedSql);

    // 3. Insert mock data for reports
    db.exec(`
      INSERT INTO categoria (id_categoria, nombre) VALUES (1, 'Test Cat');
      INSERT INTO proveedor (id_proveedor, nombre, apellido) VALUES (1, 'Test', 'Prov');
      INSERT INTO productos (id_productos, nombre, precio, id_categoria, id_proveedor, estado) VALUES 
        (1, 'Producto A', 100, 1, 1, 'Disponible'),
        (2, 'Producto B', 200, 1, 1, 'Disponible');
        
      INSERT INTO venta (id_venta, fecha, total, id_usuario) VALUES 
        (1, '2026-01-15', 500.00, 1),
        (2, '2026-01-20', 200.00, 1),
        (3, '2026-02-10', 300.00, 1);
        
      INSERT INTO venta_productos (id_venta, id_productos, cantidad, precio) VALUES 
        (1, 1, 3, 100), -- Venta 1: 3x Prod A = 300
        (1, 2, 1, 200), -- Venta 1: 1x Prod B = 200
        (2, 2, 1, 200), -- Venta 2: 1x Prod B = 200
        (3, 1, 3, 100); -- Venta 3: 3x Prod A = 300
    `);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MysqlService)
      .useValue(mockMysqlService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    db.close();
  });

  it('GET /api/sales/reports/ventas-mes -> 200 array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/ventas-mes')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`)
      .expect(200);

    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBe(2);
    expect(res.body[0].mes).toBe('2026-01');
    expect(res.body[0].total).toBe(700); // 500 + 200
    expect(res.body[1].mes).toBe('2026-02');
    expect(res.body[1].total).toBe(300);
  });

  it('GET /api/sales/reports/top-productos -> 200 array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/top-productos')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`)
      .expect(200);

    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBe(2);
    expect(res.body[0].nombre).toBe('Producto A');
    expect(res.body[0].total_vendido).toBe(6); // 3 + 3
    expect(res.body[0].total_facturado).toBe(600); // 3*100 + 3*100
    
    expect(res.body[1].nombre).toBe('Producto B');
    expect(res.body[1].total_vendido).toBe(2); // 1 + 1
    expect(res.body[1].total_facturado).toBe(400); // 1*200 + 1*200
  });

  it('GET /api/sales/reports/resumen -> 200 object', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/resumen')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`)
      .expect(200);

    expect(res.body).toHaveProperty('total_ventas', 3);
    expect(res.body).toHaveProperty('dinero_total', 1000); // 500 + 200 + 300
    // SQLite AVG returns double, we might need to be careful with exact match depending on decimal handling
    expect(res.body.promedio).toBeCloseTo(333.33, 1);
  });

  it('GET /api/sales/reports/resumen-mes -> 200 array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/resumen-mes')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`)
      .expect(200);

    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBe(2);
    expect(res.body[0].mes).toBe('2026-02'); // ORDER BY mes DESC
    expect(res.body[0].cantidad_ventas).toBe(1);
    expect(res.body[0].total_mes).toBe(300);
    
    expect(res.body[1].mes).toBe('2026-01');
    expect(res.body[1].cantidad_ventas).toBe(2);
    expect(res.body[1].total_mes).toBe(700);
  });

  it('GET /api/sales/reports/pdf-resumen -> application/pdf', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/pdf-resumen')
      .set('Authorization', \`Bearer \${tokenAdminValido}\`)
      .expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('reporte_ventas');
    expect(res.body).toBeDefined();
  }, 10000);
});
>>>>>>> origin/feature/pruebas-unitarias-integracion-products-reports
