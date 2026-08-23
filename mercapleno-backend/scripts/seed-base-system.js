require("dotenv/config");

if (!process.env.DATABASE_URL) {
  const user = encodeURIComponent(process.env.DB_USER || "root");
  const password = process.env.DB_PASSWORD
    ? `:${encodeURIComponent(process.env.DB_PASSWORD)}`
    : "";
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "3306";
  const database = process.env.DB_NAME || "mercapleno";

  process.env.DATABASE_URL = `mysql://${user}${password}@${host}:${port}/${database}`;
}

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
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO roles (id, nombre)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)
      `,
      role.id,
      role.nombre
    );
  }
}

async function seedDocumentTypes() {
  for (const documentType of documentTypeSeeds) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO tipos_identificacion (id, nombre)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)
      `,
      documentType.id,
      documentType.nombre
    );
  }
}

async function seedPaymentMethods() {
  for (const paymentMethod of paymentMethodSeeds) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO metodo (id_metodo, metodo_pago)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE metodo_pago = VALUES(metodo_pago)
      `,
      paymentMethod.id_metodo,
      paymentMethod.metodo_pago
    );
  }
}

async function seedMovementTypes() {
  for (const movementType of movementTypeSeeds) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO tipo_movimiento (id_tipo, nombre_movimiento, fecha_generar)
        VALUES (?, ?, CURDATE())
        ON DUPLICATE KEY UPDATE nombre_movimiento = VALUES(nombre_movimiento)
      `,
      movementType.id_tipo,
      movementType.nombre_movimiento
    );
  }
}

async function seedMovements() {
  for (const movement of movementSeeds) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO movimiento (id_movimiento, id_tipo, descripcion, fecha_generar)
        VALUES (?, ?, ?, CURDATE())
        ON DUPLICATE KEY UPDATE
          id_tipo = VALUES(id_tipo),
          descripcion = VALUES(descripcion)
      `,
      movement.id_movimiento,
      movement.id_tipo,
      movement.descripcion
    );
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

async function main() {
  await seedRoles();
  await seedDocumentTypes();
  await seedPaymentMethods();
  await seedMovementTypes();
  await seedMovements();
  const adminCreated = await seedDefaultAdmin();

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
