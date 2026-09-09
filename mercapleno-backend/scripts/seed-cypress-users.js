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
  { id: 2, nombre: "Tarjeta de identidad" }
];

const cypressUsers = [
  {
    nombre: "Admin",
    apellido: "Mercapleno",
    email: "admin@ejemplo.com",
    password: "Password123!",
    direccion: "Avenida Principal 123",
    fecha_nacimiento: new Date("1990-01-01"),
    id_rol: 1,
    id_tipo_identificacion: 1,
    numero_identificacion: "9000000001",
    email_verified: true,
  },
  {
    nombre: "Elena",
    apellido: "Empleado",
    email: "empleado@ejemplo.com",
    password: "Password123!",
    direccion: "Carrera 45 # 12-34",
    fecha_nacimiento: new Date("1992-05-15"),
    id_rol: 2,
    id_tipo_identificacion: 1,
    numero_identificacion: "9000000002",
    email_verified: true,
  },
  {
    nombre: "Carlos",
    apellido: "Cliente",
    email: "cliente@ejemplo.com",
    password: "Password123!",
    direccion: "Calle 10 # 20-30",
    fecha_nacimiento: new Date("1995-10-20"),
    id_rol: 3,
    id_tipo_identificacion: 1,
    numero_identificacion: "9000000003",
    email_verified: true,
  }
];

async function ensurePrerequisites() {
  for (const role of roleSeeds) {
    await prisma.roles.upsert({
      where: { id: role.id },
      update: { nombre: role.nombre },
      create: role,
    });
  }

  for (const doc of documentTypeSeeds) {
    await prisma.tipos_identificacion.upsert({
      where: { id: doc.id },
      update: { nombre: doc.nombre },
      create: doc,
    });
  }
}

async function seedCypressUsers() {
  for (const user of cypressUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const existingUser = await prisma.usuarios.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      await prisma.usuarios.update({
        where: { email: user.email },
        data: {
          nombre: user.nombre,
          apellido: user.apellido,
          password: hashedPassword,
          id_rol: user.id_rol,
          email_verified: user.email_verified,
        },
      });
      console.log(`Usuario actualizado: ${user.email} (Rol: ${user.id_rol})`);
    } else {
      const existingDoc = await prisma.usuarios.findUnique({
        where: { numero_identificacion: user.numero_identificacion },
      });

      const numeroId = existingDoc ? `${user.numero_identificacion}_${Date.now().toString().slice(-4)}` : user.numero_identificacion;

      await prisma.usuarios.create({
        data: {
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          password: hashedPassword,
          direccion: user.direccion,
          fecha_nacimiento: user.fecha_nacimiento,
          id_rol: user.id_rol,
          id_tipo_identificacion: user.id_tipo_identificacion,
          numero_identificacion: numeroId,
          email_verified: user.email_verified,
        },
      });
      console.log(`Usuario creado: ${user.email} (Rol: ${user.id_rol})`);
    }
  }
}

async function syncSequences() {
  try {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"usuarios"', 'id'), coalesce((SELECT max("id") FROM "usuarios"), 1));`
    );
  } catch {
    // Ignorar si no aplica para el motor o secuencia
  }
}

async function main() {
  console.log("Iniciando siembra de usuarios para pruebas Cypress E2E...");
  await ensurePrerequisites();
  await seedCypressUsers();
  await syncSequences();
  console.log("Usuarios para Cypress sembrados exitosamente.");
}

main()
  .catch((error) => {
    console.error("Error al sembrar usuarios para Cypress:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
