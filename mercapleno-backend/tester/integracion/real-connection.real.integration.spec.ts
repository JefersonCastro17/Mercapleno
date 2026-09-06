import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'mysql2/promise';
const request = require('supertest');
import { createRealApp } from './support/real-app';
import { cleanupFixture, createFixture, createTestPool, query, seedBase, TestFixture } from './support/test-database';

describe('Infraestructura de integracion real', () => {
  let app: INestApplication;
  let pool: Pool;
  let fixture: TestFixture;

  beforeAll(async () => {
    pool = createTestPool();
    await seedBase(pool);
    const realApp = await createRealApp();
    app = realApp.app;
  });

  beforeEach(async () => {
    const jwt = app.get(JwtService);
    const email = `bootstrap-${Date.now()}@example.test`;
    fixture = await createFixture(pool, jwt.sign({ sub: 0, id_rol: 3, email, token_type: 'access' }));
    fixture.token = jwt.sign({ sub: fixture.userId, id_rol: 3, email: fixture.email, token_type: 'access' });
  });

  afterEach(async () => {
    if (fixture) {
      await cleanupFixture(pool, fixture);
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await pool.end();
  });

  it('conecta al esquema de pruebas y crea fixtures en las tablas reales', async () => {
    const rows: any[] = await query(pool, 'SELECT COUNT(*) AS total FROM productos WHERE nombre LIKE ?', [`%${fixture.runId}%`]);
    expect(Number(rows[0].total)).toBe(5);
    expect(fixture.productIds).toHaveLength(5);

    const response = await request(app.getHttpServer())
      .get('/api/sales/products')
      .query({ search: fixture.runId });

    expect(response.status).toBe(200);
    expect(response.body.some((product: { nombre: string }) => product.nombre.includes(fixture.runId))).toBe(true);
  });
});
