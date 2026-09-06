require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const roleSeeds = [
  { id: 1, nombre: "Administrador" },
  { id: 2, nombre: "Empleado" },
  { id: 3, nombre: "Cliente" }
];

const documentTypeSeeds = [
  { id: 1, nombre: "Cedula de ciudadania" },
  { id: 2, nombre: "Tarjeta de identidad" },
  { id: 3, nombre: "Cedula de extranjeria" },
  { id: 4, nombre: "Pasaporte" },
  { id: 5, nombre: "NIT" }
];

const paymentMethodSeeds = [
  { id_metodo: "M1", metodo_pago: "Efectivo" },
  { id_metodo: "M2", metodo_pago: "Tarjeta de Credito" },
  { id_metodo: "M3", metodo_pago: "Tarjeta de Debito" },
  { id_metodo: "M4", metodo_pago: "Transferencia" },
  { id_metodo: "M5", metodo_pago: "Nequi" },
  { id_metodo: "M6", metodo_pago: "Daviplata" }
];

const movementTypeSeeds = [
  { id_tipo: 1, nombre_movimiento: "ENTRADA" },
  { id_tipo: 2, nombre_movimiento: "SALIDA" }
];

const movementSeeds = [
  { id_movimiento: 2, id_tipo: 1, descripcion: "ENTRADA INVENTARIO" },
  { id_movimiento: 3, id_tipo: 2, descripcion: "SALIDA INVENTARIO" }
];

const defaultAdmin = {
  nombre: "Admin",
  apellido: "Mercapleno",
  email: process.env.DEFAULT_ADMIN_EMAIL || "admin@mercapleno.local",
  password: process.env.DEFAULT_ADMIN_PASSWORD || "Admin123*",
  direccion: "Panel administrativo",
  fecha_nacimiento: "1990-01-01",
  id_rol: 1,
  id_tipo_identificacion: 1,
  numero_identificacion: "1000000001",
  email_verified: true
};

async function seedRoles() {
  for (const role of roleSeeds) {
    await prisma.roles.upsert({
      where: { id: role.id },
      update: { nombre: role.nombre },
      create: role,
    });
  }
}

async function seedDocumentTypes() {
  for (const documentType of documentTypeSeeds) {
    await prisma.tipos_identificacion.upsert({
      where: { id: documentType.id },
      update: { nombre: documentType.nombre },
      create: documentType,
    });
  }
}

async function seedPaymentMethods() {
  for (const paymentMethod of paymentMethodSeeds) {
    await prisma.metodo.upsert({
      where: { id_metodo: paymentMethod.id_metodo },
      update: { metodo_pago: paymentMethod.metodo_pago },
      create: paymentMethod,
    });
  }
}

async function seedMovementTypes() {
  for (const movementType of movementTypeSeeds) {
    await prisma.tipo_movimiento.upsert({
      where: { id_tipo: movementType.id_tipo },
      update: { nombre_movimiento: movementType.nombre_movimiento },
      create: {
        id_tipo: movementType.id_tipo,
        nombre_movimiento: movementType.nombre_movimiento,
        fecha_generar: new Date(),
      },
    });
  }
}

async function seedMovements() {
  for (const movement of movementSeeds) {
    await prisma.movimiento.upsert({
      where: { id_movimiento: movement.id_movimiento },
      update: {
        id_tipo: movement.id_tipo,
        descripcion: movement.descripcion,
      },
      create: {
        id_movimiento: movement.id_movimiento,
        id_tipo: movement.id_tipo,
        descripcion: movement.descripcion,
        fecha_generar: new Date(),
      },
    });
  }
}

async function seedDefaultAdmin() {
  const existingAdmin = await prisma.usuarios.findFirst({
    where: { email: defaultAdmin.email },
    select: { id: true }
  });

  if (existingAdmin) {
    return false;
  }

  const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

  await prisma.usuarios.create({
    data: {
      nombre: defaultAdmin.nombre,
      apellido: defaultAdmin.apellido,
      email: defaultAdmin.email,
      password: hashedPassword,
      direccion: defaultAdmin.direccion,
      fecha_nacimiento: new Date(defaultAdmin.fecha_nacimiento),
      id_rol: defaultAdmin.id_rol,
      id_tipo_identificacion: defaultAdmin.id_tipo_identificacion,
      numero_identificacion: defaultAdmin.numero_identificacion,
      email_verified: defaultAdmin.email_verified
    }
  });

  return true;
}

async function syncSequences() {
  const tables = [
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

  for (const { table, pk } of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', '${pk}'), coalesce((SELECT max("${pk}") FROM "${table}"), 1));`
      );
    } catch {
      // Ignorar si no aplica para el motor o secuencia
    }
  }
}

async function main() {
  await seedRoles();
  await seedDocumentTypes();
  await seedPaymentMethods();
  await seedMovementTypes();
  await seedMovements();
  const adminCreated = await seedDefaultAdmin();
  await syncSequences();

  console.log("Seed base del sistema completado");
  console.log(`Roles asegurados: ${roleSeeds.length}`);
  console.log(`Tipos de identificacion asegurados: ${documentTypeSeeds.length}`);
  console.log(`Metodos de pago asegurados: ${paymentMethodSeeds.length}`);
  console.log(`Tipos de movimiento asegurados: ${movementTypeSeeds.length}`);
  console.log(`Movimientos base asegurados: ${movementSeeds.length}`);
  console.log(`Admin por defecto creado: ${adminCreated ? "si" : "no"}`);
}

main()
  .catch((error) => {
    console.error("Fallo al sembrar la base del sistema");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
