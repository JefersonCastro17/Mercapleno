const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL || '';
const databaseName = databaseUrl.split('/').pop()?.split('?')[0] || '';

if (!databaseName.endsWith('_test')) {
  throw new Error(`Las pruebas requieren una BD *_test; se recibio: ${databaseName || 'vacia'}`);
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

async function cleanDatabase() {
  await prisma.$transaction(async (transaction) => {
    for (const table of tablesInDeleteOrder) {
      await transaction.$executeRawUnsafe(`DELETE FROM \`${table}\``);
    }
  });
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
    ],
  });
}

module.exports = { prisma, cleanDatabase, seedReferenceData };
