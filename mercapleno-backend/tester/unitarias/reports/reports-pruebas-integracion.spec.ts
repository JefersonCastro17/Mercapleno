import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../app.module';
import { MysqlService } from '../common/database/mysql.service';

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
    const resumenRow = { total_ventas: 2, dinero_total: '700.00', promedio: '350.00' };
    const topProductos = [{ nombre: 'Prod A', total_vendido: 2, total_facturado: 700 }];
    const resumenMes = [{ mes: '2026-01', cantidad_ventas: 2, total_mes: '700.00' }];

    (mockMysqlService.query as jest.Mock)
      .mockResolvedValueOnce([[resumenRow]])
      .mockResolvedValueOnce([topProductos])
      .mockResolvedValueOnce([resumenMes]);

    const res = await request(app.getHttpServer())
      .get('/api/sales/reports/pdf-resumen')
      .set('Authorization', `Bearer ${tokenAdminValido}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('reporte_ventas');
    expect(res.body).toBeDefined();
  }, 10000);
});