import { Pool } from 'pg';
import { envs } from '../../../src/config';
import {
  translateSqlToPostgres,
  formatPostgresResult,
} from '../../../src/common/database/postgres.service';

export interface TestFixture {
  runId: string;
  userId: number;
  email: string;
  token: string;
  categoryId: number;
  productIds: number[];
}

export function createTestPool(): Pool {
  if (envs.dbName !== 'mercapleno_testv1' && envs.dbName !== 'mercapleno_test') {
    throw new Error(`Base invalida para pruebas: ${envs.dbName}`);
  }

  return new Pool({
    host: envs.dbHost,
    port: envs.dbPort,
    user: envs.dbUser,
    password: envs.dbPassword,
    database: envs.dbName,
    max: 3,
  });
}

export async function query<T = any>(pool: Pool, sql: string, params: any[] = []): Promise<T> {
  const pgSql = translateSqlToPostgres(sql);
  const res = await pool.query(pgSql, params);
  const [formatted] = formatPostgresResult<T>(res, sql);
  return formatted;
}

export async function seedBase(pool: Pool): Promise<void> {
  await query(
    pool,
    "INSERT INTO roles (id, nombre) VALUES (3, 'Cliente') ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre",
  );
  await query(
    pool,
    "INSERT INTO tipos_identificacion (id, nombre) VALUES (1, 'Cedula de ciudadania') ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre",
  );
  await query(
    pool,
    "INSERT INTO metodo (id_metodo, metodo_pago) VALUES ('M1', 'Efectivo'), ('M2', 'Tarjeta de Credito'), ('M3', 'Tarjeta de Debito') ON CONFLICT (id_metodo) DO UPDATE SET metodo_pago = EXCLUDED.metodo_pago",
  );
  await query(
    pool,
    "INSERT INTO tipo_movimiento (id_tipo, nombre_movimiento, fecha_generar) VALUES (3, 'SALIDA POR VENTA', CURRENT_DATE) ON CONFLICT (id_tipo) DO UPDATE SET nombre_movimiento = EXCLUDED.nombre_movimiento",
  );
}

export async function createFixture(pool: Pool, token: string): Promise<TestFixture> {
  const runId = `it-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const email = `${runId}@example.test`;
  const identification = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

  const categoryResult: any = await query(pool, 'INSERT INTO categoria (nombre) VALUES (?)', [`Cat-${runId}`]);
  const categoryId = Number(categoryResult.insertId);
  const productIds: number[] = [];
  const products = [
    [`P-Arroz-${runId}`, 3500, 'Disponible', 5],
    [`P-Leche-${runId}`, 4200, 'Disponible', 3],
    [`P-Cafe-${runId}`, 6800, 'Disponible', 4],
    [`P-Inactivo-${runId}`, 5000, 'Deshabilitado', 0],
    [`P-Agotado-${runId}`, 4400, 'Disponible', 0],
  ];

  for (const [name, price, status, stock] of products) {
    const productResult: any = await query(
      pool,
      'INSERT INTO productos (nombre, precio, id_categoria, descripcion, estado) VALUES (?, ?, ?, ?, ?)',
      [name, price, categoryId, `Fixture ${runId}`, status],
    );
    const productId = Number(productResult.insertId);
    productIds.push(productId);
    await query(
      pool,
      'INSERT INTO stock_actual (id_productos, stock, fecha_vencimiento) VALUES (?, ?, CURRENT_DATE)',
      [productId, stock],
    );
  }

  const userResult: any = await query(
    pool,
    'INSERT INTO usuarios (nombre, apellido, email, password, direccion, fecha_nacimiento, id_rol, id_tipo_identificacion, numero_identificacion, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['Integration', 'Test', email, 'not-used', 'Test address', '1990-01-01', 3, 1, identification, true],
  );

  return { runId, userId: Number(userResult.insertId), email, token, categoryId, productIds };
}

export async function cleanupFixture(pool: Pool, fixture: TestFixture): Promise<void> {
  if (!fixture || !fixture.productIds) return;
  const productPlaceholders = fixture.productIds.map(() => '?').join(',');
  const movementRows: any[] = await query(
    pool,
    `SELECT DISTINCT id_movimiento FROM salida_productos WHERE id_productos IN (${productPlaceholders}) AND id_usuario = ?`,
    [...fixture.productIds, fixture.userId],
  );
  const movementIds = movementRows.map((row) => Number(row.id_movimiento)).filter(Boolean);
  const saleRows: any[] = await query(pool, 'SELECT id_venta FROM venta WHERE id_usuario = ?', [fixture.userId]);
  const saleIds = saleRows.map((row) => Number(row.id_venta));
  const cartRows: any[] = await query(pool, 'SELECT id FROM cart WHERE id_usuario = ?', [fixture.userId]);
  const cartIds = cartRows.map((row) => Number(row.id));

  if (cartIds.length) {
    const placeholders = cartIds.map(() => '?').join(',');
    await query(pool, `DELETE FROM cart_items WHERE cart_id IN (${placeholders})`, cartIds);
    await query(pool, `DELETE FROM cart WHERE id IN (${placeholders})`, cartIds);
  }
  if (saleIds.length) {
    const placeholders = saleIds.map(() => '?').join(',');
    await query(pool, `DELETE FROM venta_productos WHERE id_venta IN (${placeholders})`, saleIds);
    await query(pool, `DELETE FROM venta WHERE id_venta IN (${placeholders})`, saleIds);
  }
  if (movementIds.length) {
    const placeholders = movementIds.map(() => '?').join(',');
    await query(pool, `DELETE FROM salida_productos WHERE id_movimiento IN (${placeholders})`, movementIds);
    await query(pool, `UPDATE stock_actual SET id_movimiento = NULL WHERE id_productos IN (${productPlaceholders})`, fixture.productIds);
    await query(pool, `DELETE FROM movimiento WHERE id_movimiento IN (${placeholders})`, movementIds);
  }
  await query(pool, `DELETE FROM stock_actual WHERE id_productos IN (${productPlaceholders})`, fixture.productIds);
  await query(pool, `DELETE FROM productos WHERE id_productos IN (${productPlaceholders})`, fixture.productIds);
  await query(pool, 'DELETE FROM usuarios WHERE id = ?', [fixture.userId]);
  await query(pool, 'DELETE FROM categoria WHERE id_categoria = ?', [fixture.categoryId]);
}
