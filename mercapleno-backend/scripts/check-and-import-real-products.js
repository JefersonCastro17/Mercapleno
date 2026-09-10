const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const localFile = path.join(__dirname, 'data', 'productos-originales.sql');
    const downloadsFile = 'C:\\Users\\jefer\\Downloads\\productos.sql';
    const filePath = fs.existsSync(localFile) ? localFile : downloadsFile;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && l.startsWith('insert into'));
    
    console.log(`Found ${lines.length} products in ${filePath}`);

    // Ensure categories 1..15 exist
    const defaultCategories = [
      { id: 1, name: 'Abarrotes' },
      { id: 2, name: 'Lácteos' },
      { id: 3, name: 'Cárnicos' },
      { id: 4, name: 'Bebidas' },
      { id: 5, name: 'Panadería' },
      { id: 6, name: 'Frutas y Verduras' },
      { id: 7, name: 'Aseo' },
      { id: 8, name: 'Higiene Personal' },
      { id: 9, name: 'Snacks' },
      { id: 10, name: 'Congelados' },
      { id: 11, name: 'Mascotas' },
      { id: 12, name: 'Dulces y Galletas' },
      { id: 13, name: 'Lácteos Refrigerados' },
      { id: 14, name: 'Despensa' },
      { id: 15, name: 'Cuidado del Hogar' }
    ];

    for (const cat of defaultCategories) {
      await pool.query(
        'INSERT INTO categoria (id_categoria, nombre) VALUES ($1, $2) ON CONFLICT (id_categoria) DO UPDATE SET nombre = EXCLUDED.nombre',
        [cat.id, cat.name]
      );
    }
    await pool.query("SELECT setval('categoria_id_categoria_seq', (SELECT MAX(id_categoria) FROM categoria))");
    console.log('Categories updated successfully.');

    // Ensure providers 1..16 exist
    const defaultProviders = [
      { id: 1, nombre: 'Luis', apellido: 'González', tel: '3104567890' },
      { id: 2, nombre: 'María', apellido: 'Rojas', tel: '3112345678' },
      { id: 3, nombre: 'Pedro', apellido: 'Martínez', tel: '3129876543' },
      { id: 4, nombre: 'Ana', apellido: 'Pérez', tel: '3136789123' },
      { id: 5, nombre: 'Carlos', apellido: 'Ruiz', tel: '3143456789' },
      { id: 6, nombre: 'Jorge', apellido: 'Moreno', tel: '3157894321' },
      { id: 7, nombre: 'Tatiana', apellido: 'Vega', tel: '3165678912' },
      { id: 8, nombre: 'Camilo', apellido: 'Ramírez', tel: '3179876123' },
      { id: 9, nombre: 'Paola', apellido: 'Jiménez', tel: '3182345678' },
      { id: 10, nombre: 'Andrés', apellido: 'Castro', tel: '3198765432' },
      { id: 11, nombre: 'Distribuciones', apellido: 'Andina', tel: '3001002001' },
      { id: 12, nombre: 'Mercado', apellido: 'Central', tel: '3001002003' },
      { id: 13, nombre: 'Pet', apellido: 'Friends', tel: '3001002004' },
      { id: 14, nombre: 'Lácteos', apellido: 'del Valle', tel: '3001002006' },
      { id: 15, nombre: 'Maria', apellido: 'Gonzales', tel: '3007993584' },
      { id: 16, nombre: 'Distribuidora Nacional', apellido: 'Lopez', tel: '3119876543' }
    ];

    for (const prov of defaultProviders) {
      await pool.query(
        'INSERT INTO proveedor (id_proveedor, nombre, apellido, telefono, activo) VALUES ($1, $2, $3, $4, true) ON CONFLICT (id_proveedor) DO NOTHING',
        [prov.id, prov.nombre, prov.apellido, prov.tel]
      );
    }
    await pool.query("SELECT setval('proveedor_id_proveedor_seq', (SELECT MAX(id_proveedor) FROM proveedor))");
    console.log('Providers updated successfully.');

    // Clear previous dummy products & stock
    await pool.query('DELETE FROM cart_items');
    await pool.query('DELETE FROM stock_actual');
    await pool.query('DELETE FROM salida_productos');
    await pool.query('DELETE FROM entrada_productos');
    await pool.query('DELETE FROM venta_productos');
    await pool.query('DELETE FROM productos');

    // Insert real products
    for (const line of lines) {
      const cleanLine = line.replace(/overriding system value/gi, '');
      await pool.query(cleanLine);
    }

    await pool.query("SELECT setval('productos_id_productos_seq', (SELECT MAX(id_productos) FROM productos))");

    // Add initial stock for each real product using id_movimiento = 2 (ENTRADA INVENTARIO)
    const prods = await pool.query('SELECT id_productos FROM productos');
    for (const p of prods.rows) {
      await pool.query(
        'INSERT INTO stock_actual (id_productos, id_movimiento, stock, fecha_vencimiento) VALUES ($1, 2, 50, \'2026-12-31\')',
        [p.id_productos]
      );
    }

    const prodCount = await pool.query('SELECT count(*) FROM productos');
    const stockCount = await pool.query('SELECT count(*) FROM stock_actual');
    console.log(`Successfully imported ${prodCount.rows[0].count} real products and ${stockCount.rows[0].count} stock records!`);

    const sample = await pool.query('SELECT id_productos, nombre, precio, imagen FROM productos LIMIT 5');
    console.table(sample.rows);
  } catch (err) {
    console.error('Error importing products:', err);
  } finally {
    await pool.end();
  }
}
run();
