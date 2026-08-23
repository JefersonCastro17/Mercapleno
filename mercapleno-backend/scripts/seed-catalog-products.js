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

const { PrismaClient, productos_estado } = require("@prisma/client");

const prisma = new PrismaClient();

const categoryNames = ["Despensa", "Bebidas", "Aseo", "Mascotas", "Snacks"];

const providerSeeds = [
  { nombre: "Distribuciones", apellido: "Andina", telefono: "3001002001" },
  { nombre: "Casa", apellido: "Limpia", telefono: "3001002002" },
  { nombre: "Mercado", apellido: "Central", telefono: "3001002003" },
  { nombre: "Pet", apellido: "Friends", telefono: "3001002004" },
  { nombre: "Fresh", apellido: "Goods", telefono: "3001002005" }
];

const productSeeds = [
  {
    nombre: "Arroz premium 1 kg",
    precio: 5600,
    categoria: "Despensa",
    proveedor: "Distribuciones Andina",
    descripcion: "Arroz de grano largo ideal para compras del hogar.",
    imagen:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
    stock: 24
  },
  {
    nombre: "Pasta tornillo clasica",
    precio: 4200,
    categoria: "Despensa",
    proveedor: "Distribuciones Andina",
    descripcion: "Pasta seca para almuerzos rapidos y rendidores.",
    imagen:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    stock: 18
  },
  {
    nombre: "Cafe molido tradicion",
    precio: 11800,
    categoria: "Despensa",
    proveedor: "Mercado Central",
    descripcion: "Cafe molido de tueste medio para consumo diario.",
    imagen:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    stock: 10
  },
  {
    nombre: "Jugo de naranja 1 L",
    precio: 6800,
    categoria: "Bebidas",
    proveedor: "Fresh Goods",
    descripcion: "Bebida lista para servir con sabor suave y fresco.",
    imagen:
      "https://images.unsplash.com/photo-1600271886742-f049cd5bba3f?auto=format&fit=crop&w=900&q=80",
    stock: 16
  },
  {
    nombre: "Agua mineral 600 ml",
    precio: 2200,
    categoria: "Bebidas",
    proveedor: "Fresh Goods",
    descripcion: "Botella individual para consumo inmediato.",
    imagen:
      "https://images.unsplash.com/photo-1564419439288-bf6b4d2a7d6d?auto=format&fit=crop&w=900&q=80",
    stock: 40
  },
  {
    nombre: "Chocolate de mesa",
    precio: 7200,
    categoria: "Snacks",
    proveedor: "Mercado Central",
    descripcion: "Tabletas listas para bebidas calientes y recetas.",
    imagen:
      "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=900&q=80",
    stock: 11
  },
  {
    nombre: "Galletas de mantequilla",
    precio: 5100,
    categoria: "Snacks",
    proveedor: "Mercado Central",
    descripcion: "Presentacion familiar para meriendas y cafeterias.",
    imagen:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80",
    stock: 14
  },
  {
    nombre: "Detergente liquido Ariel",
    precio: 19500,
    categoria: "Aseo",
    proveedor: "Casa Limpia",
    descripcion: "Detergente para ropa con fragancia de larga duracion.",
    imagen: "images/productos/ariel.jpg",
    stock: 9
  },
  {
    nombre: "Jabon antibacterial",
    precio: 3900,
    categoria: "Aseo",
    proveedor: "Casa Limpia",
    descripcion: "Jabon de manos para uso diario en casa o negocio.",
    imagen:
      "https://images.unsplash.com/photo-1584305574647-acf2d3353f84?auto=format&fit=crop&w=900&q=80",
    stock: 20
  },
  {
    nombre: "Papel higienico x4",
    precio: 9300,
    categoria: "Aseo",
    proveedor: "Casa Limpia",
    descripcion: "Paquete multipack para hogar o tienda de conveniencia.",
    imagen:
      "https://images.unsplash.com/photo-1583947581924-a2b259f2e1ff?auto=format&fit=crop&w=900&q=80",
    stock: 13
  },
  {
    nombre: "Concentrado canino premium",
    precio: 26800,
    categoria: "Mascotas",
    proveedor: "Pet Friends",
    descripcion: "Alimento balanceado para perros adultos.",
    imagen:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80",
    stock: 7
  },
  {
    nombre: "Arena para gato 5 kg",
    precio: 18400,
    categoria: "Mascotas",
    proveedor: "Pet Friends",
    descripcion: "Arena absorbente para mantenimiento del arenero.",
    imagen:
      "https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=900&q=80",
    stock: 8
  }
];

async function ensureCategory(name) {
  const existing = await prisma.categoria.findFirst({
    where: { nombre: name },
    select: { id_categoria: true, nombre: true }
  });

  if (existing) {
    return existing;
  }

  return prisma.categoria.create({
    data: { nombre: name },
    select: { id_categoria: true, nombre: true }
  });
}

async function ensureProvider(seed) {
  const existing = await prisma.proveedor.findFirst({
    where: {
      nombre: seed.nombre,
      apellido: seed.apellido
    },
    select: { id_proveedor: true, nombre: true, apellido: true }
  });

  if (existing) {
    return existing;
  }

  return prisma.proveedor.create({
    data: seed,
    select: { id_proveedor: true, nombre: true, apellido: true }
  });
}

async function main() {
  const categoryMap = new Map();
  const providerMap = new Map();

  for (const categoryName of categoryNames) {
    const category = await ensureCategory(categoryName);
    categoryMap.set(categoryName, category);
  }

  for (const providerSeed of providerSeeds) {
    const provider = await ensureProvider(providerSeed);
    providerMap.set(`${provider.nombre} ${provider.apellido}`, provider);
  }

  let createdProducts = 0;
  let createdStocks = 0;
  let updatedStocks = 0;

  for (const productSeed of productSeeds) {
    const category = categoryMap.get(productSeed.categoria);
    const provider = providerMap.get(productSeed.proveedor);

    if (!category || !provider) {
      throw new Error(`No se pudo resolver categoria o proveedor para ${productSeed.nombre}`);
    }

    let product = await prisma.productos.findFirst({
      where: { nombre: productSeed.nombre },
      select: { id_productos: true, nombre: true }
    });

    if (!product) {
      product = await prisma.productos.create({
        data: {
          nombre: productSeed.nombre,
          precio: productSeed.precio,
          id_categoria: category.id_categoria,
          id_proveedor: provider.id_proveedor,
          descripcion: productSeed.descripcion,
          estado: productos_estado.Disponible,
          imagen: productSeed.imagen
        },
        select: { id_productos: true, nombre: true }
      });

      createdProducts += 1;
    }

    const existingStock = await prisma.stock_actual.findFirst({
      where: { id_productos: product.id_productos },
      select: { id_inventario: true, stock: true }
    });

    if (!existingStock) {
      await prisma.stock_actual.create({
        data: {
          id_productos: product.id_productos,
          stock: productSeed.stock
        }
      });

      createdStocks += 1;
      continue;
    }

    if ((existingStock.stock ?? 0) <= 0) {
      await prisma.stock_actual.update({
        where: { id_inventario: existingStock.id_inventario },
        data: { stock: productSeed.stock }
      });
      updatedStocks += 1;
    }
  }

  console.log("Seed de catalogo completado");
  console.log(`Categorias aseguradas: ${categoryMap.size}`);
  console.log(`Proveedores asegurados: ${providerMap.size}`);
  console.log(`Productos creados: ${createdProducts}`);
  console.log(`Stocks creados: ${createdStocks}`);
  console.log(`Stocks reactivados: ${updatedStocks}`);
}

main()
  .catch((error) => {
    console.error("Fallo al sembrar productos del catalogo");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
