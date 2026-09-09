import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
const request = require('supertest');
import { createRealApp } from '../support/real-app';
import { cleanupFixture, createFixture, createTestPool, query, seedBase, TestFixture } from '../support/test-database';

describe('CartService - integracion real', () => {
  let app: INestApplication;
  let pool: Pool;
  let fixture: TestFixture;
  let jwt: JwtService;

  const auth = () => ({ Authorization: `Bearer ${fixture.token}` });
  const product = (index: number) => fixture.productIds[index];
  const add = (productId: number, quantity: number) => request(app.getHttpServer())
    .post('/api/cart/items')
    .set(auth())
    .send({ productId, quantity });

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

  it('CP-081: agrega un producto al carrito persistido', async () => {
    const response = await add(product(0), 2);
    const cart = await request(app.getHttpServer()).get('/api/cart').set(auth());
    expect(response.status).toBe(201);
    expect(cart.body).toHaveLength(1);
    expect(cart.body[0].quantity).toBe(2);
  });

  it('CP-082: rechaza una cantidad superior al stock', async () => {
    const response = await add(product(0), 99);
    expect(response.status).toBe(409);
  });

  it('CP-083: rechaza un producto deshabilitado', async () => {
    const response = await add(product(3), 1);
    expect(response.status).toBe(409);
  });

  it('CP-084: incrementa el item existente sin duplicarlo', async () => {
    await add(product(0), 1);
    const response = await add(product(0), 2);
    const rows: any[] = await query(pool, 'SELECT cantidad FROM cart_items ci JOIN cart c ON c.id = ci.cart_id WHERE c.id_usuario = ?', [fixture.userId]);
    expect(response.status).toBe(201);
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].cantidad)).toBe(3);
  });

  it('CP-085: rechaza datos invalidos del carrito', async () => {
    const response = await add(Number.NaN, -1);
    expect(response.status).toBe(400);
  });

  it('CP-086: calcula subtotal, impuesto y total desde la base real', async () => {
    await add(product(0), 2);
    await add(product(1), 1);
    const response = await request(app.getHttpServer()).get('/api/cart/sum').set(auth());
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.subtotal).toBe(11200);
    expect(response.body.tax).toBe(2128);
    expect(response.body.total).toBe(13328);
  });

  it('CP-087: un carrito nuevo devuelve una lista vacia', async () => {
    const response = await request(app.getHttpServer()).get('/api/cart').set(auth());
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('CP-088: el calculo exacto coincide con los valores esperados', async () => {
    await add(product(0), 1);
    const response = await request(app.getHttpServer()).get('/api/cart/sum').set(auth());
    expect(response.body.subtotal).toBe(3500);
    expect(response.body.tax).toBe(665);
    expect(response.body.total).toBe(4165);
  });

  it('CP-089: el carrito privado exige autenticacion', async () => {
    const response = await request(app.getHttpServer()).get('/api/cart');
    expect(response.status).toBe(401);
  });

  it('CP-091: elimina un item persistido del carrito', async () => {
    await add(product(0), 1);
    const cart: any[] = await request(app.getHttpServer()).get('/api/cart').set(auth()).then((response: any) => response.body);
    const response = await request(app.getHttpServer()).delete(`/api/cart/items/${cart[0].id}`).set(auth());
    const rows: any[] = await query(pool, 'SELECT COUNT(*) AS total FROM cart_items ci JOIN cart c ON c.id = ci.cart_id WHERE c.id_usuario = ?', [fixture.userId]);
    expect(response.status).toBe(200);
    expect(Number(rows[0].total)).toBe(0);
  });

  it('CP-092: rechaza actualizar una cantidad superior al stock', async () => {
    await add(product(0), 1);
    const cart: any[] = await request(app.getHttpServer()).get('/api/cart').set(auth()).then((response: any) => response.body);
    const response = await request(app.getHttpServer()).patch(`/api/cart/items/${cart[0].id}`).set(auth()).send({ quantity: 99 });
    expect(response.status).toBe(409);
  });

  it('CP-093: actualiza cantidad valida sin duplicar el item', async () => {
    await add(product(0), 1);
    const cart: any[] = await request(app.getHttpServer()).get('/api/cart').set(auth()).then((response: any) => response.body);
    const response = await request(app.getHttpServer()).patch(`/api/cart/items/${cart[0].id}`).set(auth()).send({ quantity: 3 });
    const rows: any[] = await query(pool, 'SELECT COUNT(*) AS total, MAX(cantidad) AS cantidad FROM cart_items WHERE id = ?', [cart[0].id]);
    expect(response.status).toBe(200);
    expect(Number(rows[0].total)).toBe(1);
    expect(Number(rows[0].cantidad)).toBe(3);
  });

  it('CP-094: rechaza actualizar con cantidad invalida', async () => {
    await add(product(0), 1);
    const cart: any[] = await request(app.getHttpServer()).get('/api/cart').set(auth()).then((response: any) => response.body);
    const response = await request(app.getHttpServer()).patch(`/api/cart/items/${cart[0].id}`).set(auth()).send({ quantity: 0 });
    expect(response.status).toBe(400);
  });
});
