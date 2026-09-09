import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
const request = require('supertest');
import { createRealApp } from '../support/real-app';
import { cleanupFixture, createFixture, createTestPool, query, seedBase, TestFixture } from '../support/test-database';

describe('SalesService - integracion real', () => {
  let app: INestApplication;
  let pool: Pool;
  let fixture: TestFixture;
  let jwt: JwtService;

  const auth = () => ({ Authorization: `Bearer ${fixture.token}` });
  const product = (index: number) => fixture.productIds[index];

  beforeAll(async () => {
    pool = createTestPool();
    await seedBase(pool);
    const realApp = await createRealApp();
    app = realApp.app;
    jwt = app.get(JwtService);
  });

  beforeEach(async () => {
    fixture = await createFixture(pool, '');
    fixture.token = jwt.sign({ sub: fixture.userId, id_rol: 3, email: fixture.email, token_type: 'access' });
  });

  afterEach(async () => {
    await cleanupFixture(pool, fixture);
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('CP-071: carga productos disponibles con stock', async () => {
    const response = await request(app.getHttpServer()).get('/api/sales/products').query({ search: fixture.runId });
    expect(response.status).toBe(200);
    expect(response.body.some((item: any) => item.id === String(product(0)))).toBe(true);
    expect(response.body.some((item: any) => item.id === String(product(3)))).toBe(false);
  });

  it('CP-072: excluye productos deshabilitados o agotados', async () => {
    const response = await request(app.getHttpServer()).get('/api/sales/products').query({ search: fixture.runId });
    const ids = response.body.map((item: any) => String(item.id));
    expect(ids).toContain(String(product(0)));
    expect(ids).not.toContain(String(product(3)));
    expect(ids).not.toContain(String(product(4)));
  });

  it('CP-073: el catalogo real es publico y devuelve datos', async () => {
    const response = await request(app.getHttpServer()).get('/api/sales/products').query({ search: fixture.runId });
    expect(response.status).toBe(200);
  });

  it('CP-074: conserva resultados consistentes al consultar parametros de pagina', async () => {
    const page1 = await request(app.getHttpServer()).get('/api/sales/products').query({ search: fixture.runId, page: 1, limit: 2 });
    const page2 = await request(app.getHttpServer()).get('/api/sales/products').query({ search: fixture.runId, page: 2, limit: 2 });
    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body).toEqual(page2.body);
  });

  it('CP-075: aplica filtros de nombre, categoria y rango de precios', async () => {
    const byName = await request(app.getHttpServer()).get('/api/sales/products').query({ search: 'Leche' });
    const byCategory = await request(app.getHttpServer()).get('/api/sales/products').query({ search: fixture.runId, category: `Cat-${fixture.runId}` });
    const byPrice = await request(app.getHttpServer()).get('/api/sales/products').query({ search: fixture.runId, precioMin: 3000, precioMax: 7000 });
    expect(byName.body).toHaveLength(1);
    expect(byCategory.body.every((item: any) => item.category === `cat-${fixture.runId}`)).toBe(true);
    expect(byPrice.body.every((item: any) => item.price >= 3000 && item.price <= 7000)).toBe(true);
  });

  it('CP-076: la busqueda por nombre devuelve coincidencias', async () => {
    const response = await request(app.getHttpServer()).get('/api/sales/products').query({ search: 'Arroz' });
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(String(product(0)));
  });

  it('CP-077: el filtro por categoria restringe resultados', async () => {
    const response = await request(app.getHttpServer()).get('/api/sales/products').query({ search: fixture.runId, category: `Cat-${fixture.runId}` });
    expect(response.body.every((item: any) => item.category === `cat-${fixture.runId}`)).toBe(true);
  });

  it('CP-078: el filtro por precio devuelve productos dentro del rango', async () => {
    const response = await request(app.getHttpServer()).get('/api/sales/products').query({ search: fixture.runId, precioMin: 6000, precioMax: 10000 });
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((item: any) => item.price >= 6000 && item.price <= 10000)).toBe(true);
  });

  it('CP-079: una busqueda sin coincidencias devuelve arreglo vacio', async () => {
    const response = await request(app.getHttpServer()).get('/api/sales/products').query({ search: `missing-${fixture.runId}` });
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('CP-080: categorias y metodos de pago son accesibles publicamente', async () => {
    const categories = await request(app.getHttpServer()).get('/api/sales/categories');
    const methods = await request(app.getHttpServer()).get('/api/sales/payment-methods');
    expect(categories.status).toBe(200);
    expect(methods.status).toBe(200);
    expect(methods.body.some((item: any) => item.id_metodo === 'M1')).toBe(true);
  });

  it('CP-095: registra una orden con metodo valido y persistencia real', async () => {
    const response = await request(app.getHttpServer()).post('/api/sales/orders').set(auth()).send({ items: [{ id: String(product(0)), cantidad: 1 }], total: 3500, id_metodo: 'M2' });
    expect(response.status).toBe(201);
    const rows: any[] = await query(pool, 'SELECT id_metodo FROM venta WHERE id_venta = ?', [response.body.ticketId]);
    expect(rows[0].id_metodo).toBe('M2');
  });

  it('CP-096: conserva el metodo de pago por defecto', async () => {
    const response = await request(app.getHttpServer()).post('/api/sales/orders').set(auth()).send({ items: [{ id: String(product(0)), cantidad: 1 }], total: 3500 });
    expect(response.status).toBe(201);
    const rows: any[] = await query(pool, 'SELECT id_metodo FROM venta WHERE id_venta = ?', [response.body.ticketId]);
    expect(rows[0].id_metodo).toBe('M1');
  });

  it('CP-097: rechaza un metodo de pago no soportado', async () => {
    const response = await request(app.getHttpServer()).post('/api/sales/orders').set(auth()).send({ items: [{ id: String(product(0)), cantidad: 1 }], total: 3500, id_metodo: 'M99' });
    expect(response.status).toBe(400);
  });

  it('CP-099: crea venta, detalle, salida, movimiento y descuenta stock', async () => {
    const response = await request(app.getHttpServer()).post('/api/sales/orders').set(auth()).send({ items: [{ id: String(product(0)), cantidad: 1 }], total: 3500, id_metodo: 'M1' });
    expect(response.status).toBe(201);
    const sales: any[] = await query(pool, 'SELECT id_venta FROM venta WHERE id_venta = ? AND id_usuario = ?', [response.body.ticketId, fixture.userId]);
    const details: any[] = await query(pool, 'SELECT * FROM venta_productos WHERE id_venta = ?', [response.body.ticketId]);
    const exits: any[] = await query(pool, 'SELECT * FROM salida_productos WHERE id_usuario = ? AND id_productos = ?', [fixture.userId, product(0)]);
    const stock: any[] = await query(pool, 'SELECT stock FROM stock_actual WHERE id_productos = ?', [product(0)]);
    expect(sales).toHaveLength(1);
    expect(details).toHaveLength(1);
    expect(exits).toHaveLength(1);
    expect(Number(stock[0].stock)).toBe(4);
  });

  it('CP-100: rechaza checkout sin stock y no crea venta parcial', async () => {
    const before: any[] = await query(pool, 'SELECT COUNT(*) AS total FROM venta WHERE id_usuario = ?', [fixture.userId]);
    const response = await request(app.getHttpServer()).post('/api/sales/orders').set(auth()).send({ items: [{ id: String(product(4)), cantidad: 1 }], total: 4400, id_metodo: 'M1' });
    const after: any[] = await query(pool, 'SELECT COUNT(*) AS total FROM venta WHERE id_usuario = ?', [fixture.userId]);
    expect(response.status).toBe(409);
    expect(Number(after[0].total)).toBe(Number(before[0].total));
  });

  it('CP-102: rechaza una orden sin autenticacion', async () => {
    const response = await request(app.getHttpServer()).post('/api/sales/orders').send({ items: [{ id: String(product(0)), cantidad: 1 }], total: 3500, id_metodo: 'M1' });
    expect(response.status).toBe(401);
  });

  it('CP-103: rechaza totales que no coinciden con los productos', async () => {
    const response = await request(app.getHttpServer()).post('/api/sales/orders').set(auth()).send({ items: [{ id: String(product(0)), cantidad: 1 }], total: 9999, id_metodo: 'M1' });
    expect(response.status).toBe(400);
  });
});
