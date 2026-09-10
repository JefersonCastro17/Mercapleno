require('dotenv/config');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  try {
    // 1. Ensure tipo_movimiento has 1, 2, 3
    await pool.query(`
      INSERT INTO tipo_movimiento (id_tipo, nombre_movimiento, fecha_generar)
      VALUES 
        (1, 'ENTRADA', NOW()),
        (2, 'SALIDA', NOW()),
        (3, 'SALIDA', NOW())
      ON CONFLICT (id_tipo) DO UPDATE SET nombre_movimiento = EXCLUDED.nombre_movimiento;
    `);
    console.log('tipo_movimiento ensured with 1, 2, 3.');

    // 2. Ensure base movements exist in movimiento
    await pool.query(`
      INSERT INTO movimiento (id_movimiento, id_tipo, descripcion, fecha_generar)
      VALUES 
        (1, 1, 'ENTRADA INVENTARIO', NOW()),
        (2, 1, 'ENTRADA INVENTARIO', NOW()),
        (3, 2, 'SALIDA INVENTARIO', NOW())
      ON CONFLICT (id_movimiento) DO UPDATE SET id_tipo = EXCLUDED.id_tipo;
    `);
    console.log('Base movimientos (1, 2, 3) ensured.');

    // 3. Sync all sequences to max id + 1
    const syncTables = [
      { table: 'movimiento', id: 'id_movimiento', seq: 'movimiento_id_movimiento_seq' },
      { table: 'venta', id: 'id_venta', seq: 'venta_id_venta_seq' },
      { table: 'entrada_productos', id: 'id_entrada', seq: 'entrada_productos_id_entrada_seq' },
      { table: 'salida_productos', id: 'id_salida', seq: 'salida_productos_id_salida_seq' },
      { table: 'stock_actual', id: 'id_inventario', seq: 'stock_actual_id_inventario_seq' },
      { table: 'productos', id: 'id_productos', seq: 'productos_id_productos_seq' },
      { table: 'usuarios', id: 'id', seq: 'usuarios_id_seq' },
      { table: 'categoria', id: 'id_categoria', seq: 'categoria_id_categoria_seq' },
      { table: 'proveedor', id: 'id_proveedor', seq: 'proveedor_id_proveedor_seq' }
    ];

    for (const item of syncTables) {
      try {
        await pool.query(`
          SELECT setval('${item.seq}', COALESCE((SELECT MAX(${item.id}) FROM ${item.table}), 1));
        `);
        console.log(`Sequence ${item.seq} synced.`);
      } catch (e) {
        console.warn(`Could not sync ${item.seq}: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('Error during fix:', err);
  } finally {
    await pool.end();
  }
}
fix();
