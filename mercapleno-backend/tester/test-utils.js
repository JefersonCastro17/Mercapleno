const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Asegurar que las variables de .env.test estén cargadas
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test'), override: false });

const databaseUrl =
  process.env.DATABASE_URL || 'mysql://root:root123@localhost:3308/mercapleno_test';

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
      { id: 2, nombre: 'Tarjeta de identidad' },
    ],
  });
}

module.exports = { prisma, cleanDatabase, seedReferenceData };
