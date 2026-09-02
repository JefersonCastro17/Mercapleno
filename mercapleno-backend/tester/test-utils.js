const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Asegurar que las variables de .env.test estén cargadas
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test'), override: false });

const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5433/mercapleno_test?schema=public';

const databaseName = databaseUrl.split('/').pop()?.split('?')[0] || '';

if (!databaseName.endsWith('_test')) {
  throw new Error(`Las pruebas de integracion requieren una BD *_test; se recibio: ${databaseName || 'vacia'}`);
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const tablesInDeleteOrder = [
  'cart_items',
  'venta_productos',
  'entrada_productos',
  'salida_productos',
  'devolver_productos',
  'stock_actual',
  'cart',
  'venta',
  'productos',
  'movimiento',
  'usuarios',
  'categoria',
  'proveedor',
  'tipo_movimiento',
  'tipo_devolucion',
  'metodo',
  'roles',
  'tipos_identificacion',
];

const tablesWithPk = [
  { table: 'roles', pk: 'id' },
  { table: 'tipos_identificacion', pk: 'id' },
  { table: 'categoria', pk: 'id_categoria' },
  { table: 'proveedor', pk: 'id_proveedor' },
  { table: 'tipo_movimiento', pk: 'id_tipo' },
  { table: 'tipo_devolucion', pk: 'id_tipo_devolucion' },
  { table: 'usuarios', pk: 'id' },
  { table: 'productos', pk: 'id_productos' },
  { table: 'movimiento', pk: 'id_movimiento' },
  { table: 'stock_actual', pk: 'id_inventario' },
  { table: 'entrada_productos', pk: 'id_entrada' },
  { table: 'salida_productos', pk: 'id_salida' },
  { table: 'devolver_productos', pk: 'id_devolucion' },
  { table: 'venta', pk: 'id_venta' },
  { table: 'cart', pk: 'id' },
  { table: 'cart_items', pk: 'id' },
];

async function syncSequences() {
  for (const { table, pk } of tablesWithPk) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', '${pk}'), coalesce((SELECT max("${pk}") FROM "${table}"), 1));`
      );
    } catch {
      // Ignorar si no aplica para la secuencia
    }
  }
}

async function cleanDatabase() {
  await prisma.$transaction(async (transaction) => {
    for (const table of tablesInDeleteOrder) {
      await transaction.$executeRawUnsafe(`DELETE FROM "${table}"`);
    }
  });

  await syncSequences();
}

async function seedReferenceData() {
  await prisma.roles.createMany({
    data: [
      { id: 1, nombre: 'Administrador' },
      { id: 2, nombre: 'Empleado' },
      { id: 3, nombre: 'Cliente' },
    ],
  });

  await prisma.tipos_identificacion.createMany({
    data: [
      { id: 1, nombre: 'Cedula de ciudadania' },
      { id: 2, nombre: 'Tarjeta de identidad' },
    ],
  });

  await syncSequences();
}

module.exports = { prisma, cleanDatabase, seedReferenceData, syncSequences };
