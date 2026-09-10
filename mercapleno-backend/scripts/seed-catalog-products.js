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

const categoryNames = [
  "Despensa",
  "Lácteos y Huevos",
  "Bebidas",
  "Aseo y Limpieza",
  "Snacks y Dulces",
  "Mascotas",
  "Frutas y Verduras"
];

const providerSeeds = [
  { nombre: "Distribuciones", apellido: "Andina", telefono: "3001002001" },
  { nombre: "Casa", apellido: "Limpia", telefono: "3001002002" },
  { nombre: "Mercado", apellido: "Central", telefono: "3001002003" },
  { nombre: "Pet", apellido: "Friends", telefono: "3001002004" },
  { nombre: "Fresh", apellido: "Goods", telefono: "3001002005" },
  { nombre: "Lácteos", apellido: "del Valle", telefono: "3001002006" }
];

const productSeeds = [
  {
    nombre: "Leche Entera 1L",
    precio: 4800,
    categoria: "Lácteos y Huevos",
    proveedor: "Lácteos del Valle",
    descripcion: "Leche entera ultrapasteurizada 100% pura de vaca.",
    imagen: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
    stock: 35
  },
  {
    nombre: "Huevos AA x30",
    precio: 18500,
    categoria: "Lácteos y Huevos",
    proveedor: "Mercado Central",
    descripcion: "Cubeta de huevos frescos seleccionados tamaño AA.",
    imagen: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80",
    stock: 25
  },
  {
    nombre: "Aceite Vegetal 1L",
    precio: 12500,
    categoria: "Despensa",
    proveedor: "Distribuciones Andina",
    descripcion: "Aceite vegetal refinado para todo tipo de preparaciones.",
    imagen: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
    stock: 40
  },
  {
    nombre: "Arroz premium 1 kg",
    precio: 5600,
    categoria: "Despensa",
    proveedor: "Distribuciones Andina",
    descripcion: "Arroz de grano largo ideal para compras del hogar.",
    imagen: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
    stock: 50
  },
  {
    nombre: "Pan Tajado Blanco",
    precio: 6200,
    categoria: "Despensa",
    proveedor: "Mercado Central",
    descripcion: "Pan de molde suave y esponjoso para sándwiches y desayunos.",
    imagen: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    stock: 20
  },
  {
    nombre: "Café molido tradicion 500g",
    precio: 14500,
    categoria: "Despensa",
    proveedor: "Mercado Central",
    descripcion: "Café 100% colombiano tostado y molido de aroma intenso.",
    imagen: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    stock: 30
  },
  {
    nombre: "Azúcar Blanco 1 kg",
    precio: 4500,
    categoria: "Despensa",
    proveedor: "Distribuciones Andina",
    descripcion: "Azúcar refinada de alta pureza.",
    imagen: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=800&q=80",
    stock: 45
  },
  {
    nombre: "Pasta tornillo clasica",
    precio: 4200,
    categoria: "Despensa",
    proveedor: "Distribuciones Andina",
    descripcion: "Pasta seca para almuerzos rapidos y rendidores.",
    imagen: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    stock: 40
  },
  {
    nombre: "Lentejas Seleccionadas 500g",
    precio: 4200,
    categoria: "Despensa",
    proveedor: "Distribuciones Andina",
    descripcion: "Lentejas secas de rápida cocción y alto valor nutricional.",
    imagen: "https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=800&q=80",
    stock: 30
  },
  {
    nombre: "Atún en Aceite 170g",
    precio: 7800,
    categoria: "Despensa",
    proveedor: "Distribuciones Andina",
    descripcion: "Lomitos de atún en aceite vegetal listos para consumir.",
    imagen: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    stock: 60
  },
  {
    nombre: "Queso Campesino 500g",
    precio: 11200,
    categoria: "Lácteos y Huevos",
    proveedor: "Lácteos del Valle",
    descripcion: "Queso fresco semigraso tradicional.",
    imagen: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=800&q=80",
    stock: 15
  },
  {
    nombre: "Yogurt Fresa 1L",
    precio: 7400,
    categoria: "Lácteos y Huevos",
    proveedor: "Lácteos del Valle",
    descripcion: "Bebida láctea con trozos de fruta y probióticos.",
    imagen: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
    stock: 25
  },
  {
    nombre: "Jugo de naranja 1 L",
    precio: 6800,
    categoria: "Bebidas",
    proveedor: "Fresh Goods",
    descripcion: "Bebida lista para servir con sabor suave y fresco.",
    imagen: "https://images.unsplash.com/photo-1600271886742-f049cd5bba3f?auto=format&fit=crop&w=900&q=80",
    stock: 20
  },
  {
    nombre: "Agua mineral 600 ml",
    precio: 2200,
    categoria: "Bebidas",
    proveedor: "Fresh Goods",
    descripcion: "Botella individual para consumo inmediato.",
    imagen: "https://images.unsplash.com/photo-1564419439288-bf6b4d2a7d6d?auto=format&fit=crop&w=900&q=80",
    stock: 50
  },
  {
    nombre: "Gaseosa Cola 1.5L",
    precio: 5500,
    categoria: "Bebidas",
    proveedor: "Fresh Goods",
    descripcion: "Bebida refrescante sabor cola con gas.",
    imagen: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
    stock: 35
  },
  {
    nombre: "Cerveza Lata 330ml",
    precio: 3800,
    categoria: "Bebidas",
    proveedor: "Fresh Goods",
    descripcion: "Cerveza rubia tipo lager de sabor equilibrado.",
    imagen: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80",
    stock: 48
  },
  {
    nombre: "Detergente liquido 2L",
    precio: 24900,
    categoria: "Aseo y Limpieza",
    proveedor: "Casa Limpia",
    descripcion: "Detergente concentrado para ropa con fragancia de larga duración.",
    imagen: "https://images.unsplash.com/photo-1583947581924-a2b259f2e1ff?auto=format&fit=crop&w=900&q=80",
    stock: 20
  },
  {
    nombre: "Jabon antibacterial",
    precio: 3900,
    categoria: "Aseo y Limpieza",
    proveedor: "Casa Limpia",
    descripcion: "Jabon de manos para uso diario en casa o negocio.",
    imagen: "https://images.unsplash.com/photo-1584305574647-acf2d3353f84?auto=format&fit=crop&w=900&q=80",
    stock: 30
  },
  {
    nombre: "Papel higienico x12",
    precio: 21500,
    categoria: "Aseo y Limpieza",
    proveedor: "Casa Limpia",
    descripcion: "Paquete multipack doble hoja resistente.",
    imagen: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80",
    stock: 25
  },
  {
    nombre: "Lavaloza Líquido 750ml",
    precio: 7200,
    categoria: "Aseo y Limpieza",
    proveedor: "Casa Limpia",
    descripcion: "Gel desengrasante con aroma a limón.",
    imagen: "https://images.unsplash.com/photo-1585670270608-b424214c721f?auto=format&fit=crop&w=800&q=80",
    stock: 30
  },
  {
    nombre: "Desinfectante Multiusos 1L",
    precio: 6500,
    categoria: "Aseo y Limpieza",
    proveedor: "Casa Limpia",
    descripcion: "Limpiador de pisos y superficies aroma lavanda.",
    imagen: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80",
    stock: 25
  },
  {
    nombre: "Papas Fritas Clásicas 115g",
    precio: 4600,
    categoria: "Snacks y Dulces",
    proveedor: "Mercado Central",
    descripcion: "Papas crujientes con un toque ideal de sal.",
    imagen: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80",
    stock: 40
  },
  {
    nombre: "Galletas de mantequilla",
    precio: 5100,
    categoria: "Snacks y Dulces",
    proveedor: "Mercado Central",
    descripcion: "Presentacion familiar para meriendas y cafeterias.",
    imagen: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80",
    stock: 35
  },
  {
    nombre: "Chocolate de mesa",
    precio: 7200,
    categoria: "Snacks y Dulces",
    proveedor: "Mercado Central",
    descripcion: "Tabletas listas para bebidas calientes y recetas.",
    imagen: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=900&q=80",
    stock: 25
  },
  {
    nombre: "Manzana Roja 1 kg",
    precio: 7800,
    categoria: "Frutas y Verduras",
    proveedor: "Fresh Goods",
    descripcion: "Manzanas frescas crujientes y dulces seleccionadas.",
    imagen: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80",
    stock: 30
  },
  {
    nombre: "Plátano Maduro 1 kg",
    precio: 3800,
    categoria: "Frutas y Verduras",
    proveedor: "Fresh Goods",
    descripcion: "Plátanos ideales para freír o asar.",
    imagen: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80",
    stock: 35
  },
  {
    nombre: "Tomate Chonto 1 kg",
    precio: 4200,
    categoria: "Frutas y Verduras",
    proveedor: "Fresh Goods",
    descripcion: "Tomates frescos para ensaladas y guisos.",
    imagen: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80",
    stock: 40
  },
  {
    nombre: "Cebolla Cabezona 1 kg",
    precio: 3600,
    categoria: "Frutas y Verduras",
    proveedor: "Fresh Goods",
    descripcion: "Cebolla fresca de primera calidad.",
    imagen: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
    stock: 30
  },
  {
    nombre: "Concentrado canino premium",
    precio: 26800,
    categoria: "Mascotas",
    proveedor: "Pet Friends",
    descripcion: "Alimento balanceado para perros adultos.",
    imagen: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80",
    stock: 15
  },
  {
    nombre: "Arena para gato 5 kg",
    precio: 18400,
    categoria: "Mascotas",
    proveedor: "Pet Friends",
    descripcion: "Arena absorbente para mantenimiento del arenero.",
    imagen: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=900&q=80",
    stock: 18
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
