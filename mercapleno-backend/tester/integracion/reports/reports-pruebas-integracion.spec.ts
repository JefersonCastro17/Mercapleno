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