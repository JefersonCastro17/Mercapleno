const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importFullDatabase() {
  console.log('--- Iniciando Importación de Datos Reales a PostgreSQL ---');

  // 1. ROLES
  const rolesData = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Empleado' },
    { id: 3, nombre: 'Cliente' },
  ];
  for (const r of rolesData) {
    await prisma.roles.upsert({
      where: { id: r.id },
      update: { nombre: r.nombre },
      create: r,
    });
  }
  console.log(`✓ Roles importados: ${rolesData.length}`);

  // 2. TIPOS DE IDENTIFICACIÓN
  const tiposIdData = [
    { id: 1, nombre: 'Cédula de ciudadanía' },
    { id: 2, nombre: 'Tarjeta de identidad' },
    { id: 3, nombre: 'Cédula de extranjería' },
    { id: 4, nombre: 'Pasaporte' },
    { id: 5, nombre: 'NIT' },
  ];
  for (const t of tiposIdData) {
    await prisma.tipos_identificacion.upsert({
      where: { id: t.id },
      update: { nombre: t.nombre },
      create: t,
    });
  }
  console.log(`✓ Tipos de identificación importados: ${tiposIdData.length}`);

  // 3. CATEGORÍAS
  const categoriasData = [
    { id_categoria: 1, nombre: 'Abarrotes' },
    { id_categoria: 2, nombre: 'Lácteos' },
    { id_categoria: 3, nombre: 'Cárnicos' },
    { id_categoria: 4, nombre: 'Bebidas' },
    { id_categoria: 5, nombre: 'Panadería' },
    { id_categoria: 6, nombre: 'Frutas y Verduras' },
    { id_categoria: 7, nombre: 'Aseo' },
    { id_categoria: 8, nombre: 'Higiene Personal' },
    { id_categoria: 9, nombre: 'Snacks' },
    { id_categoria: 10, nombre: 'Congelados' },
  ];
  for (const c of categoriasData) {
    await prisma.categoria.upsert({
      where: { id_categoria: c.id_categoria },
      update: { nombre: c.nombre },
      create: c,
    });
  }
  console.log(`✓ Categorías importadas: ${categoriasData.length}`);

  // 4. MÉTODOS DE PAGO
  const metodosData = [
    { id_metodo: 'M1', metodo_pago: 'Efectivo' },
    { id_metodo: 'M2', metodo_pago: 'Tarjeta crédito' },
    { id_metodo: 'M3', metodo_pago: 'Tarjeta débito' },
    { id_metodo: 'M4', metodo_pago: 'Transferencia' },
    { id_metodo: 'M5', metodo_pago: 'Nequi' },
    { id_metodo: 'M6', metodo_pago: 'Daviplata' },
  ];
  for (const m of metodosData) {
    await prisma.metodo.upsert({
      where: { id_metodo: m.id_metodo },
      update: { metodo_pago: m.metodo_pago },
      create: m,
    });
  }
  console.log(`✓ Métodos de pago importados: ${metodosData.length}`);

  // 5. PROVEEDORES
  const proveedoresData = [
    { id_proveedor: 1, nombre: 'Luis', apellido: 'González', telefono: '3104567890', activo: true },
    { id_proveedor: 2, nombre: 'María', apellido: 'Rojas', telefono: '3112345678', activo: true },
    { id_proveedor: 3, nombre: 'Pedro', apellido: 'Martínez', telefono: '3129876543', activo: true },
    { id_proveedor: 4, nombre: 'Ana', apellido: 'Pérez', telefono: '3136789123', activo: true },
    { id_proveedor: 5, nombre: 'Carlos', apellido: 'Ruiz', telefono: '3143456789', activo: true },
    { id_proveedor: 6, nombre: 'Jorge', apellido: 'Moreno', telefono: '3157894321', activo: true },
    { id_proveedor: 7, nombre: 'Tatiana', apellido: 'Vega', telefono: '3165678912', activo: true },
    { id_proveedor: 8, nombre: 'Camilo', apellido: 'Ramírez', telefono: '3179876123', activo: true },
    { id_proveedor: 9, nombre: 'Paola', apellido: 'Jiménez', telefono: '3182345678', activo: true },
    { id_proveedor: 10, nombre: 'Andrés', apellido: 'Castro', telefono: '3198765432', activo: true },
  ];
  for (const p of proveedoresData) {
    await prisma.proveedor.upsert({
      where: { id_proveedor: p.id_proveedor },
      update: { nombre: p.nombre, apellido: p.apellido, telefono: p.telefono, activo: p.activo },
      create: p,
    });
  }
  console.log(`✓ Proveedores importados: ${proveedoresData.length}`);

  // 6. TIPOS DE MOVIMIENTO
  const tiposMovData = [
    { id_tipo: 1, nombre_movimiento: 'Devolución', fecha_generar: new Date('2025-10-22') },
    { id_tipo: 2, nombre_movimiento: 'Entrada', fecha_generar: new Date('2025-10-22') },
    { id_tipo: 3, nombre_movimiento: 'Salida', fecha_generar: new Date('2025-10-22') },
  ];
  for (const tm of tiposMovData) {
    await prisma.tipo_movimiento.upsert({
      where: { id_tipo: tm.id_tipo },
      update: { nombre_movimiento: tm.nombre_movimiento, fecha_generar: tm.fecha_generar },
      create: tm,
    });
  }
  console.log(`✓ Tipos de movimiento importados: ${tiposMovData.length}`);

  // 7. MOVIMIENTOS
  const movimientosData = [
    { id_movimiento: 1, id_tipo: 2, descripcion: 'Ingreso de abarrotes', fecha_generar: new Date('2025-10-22') },
    { id_movimiento: 2, id_tipo: 3, descripcion: 'Venta mostrador', fecha_generar: new Date('2025-10-22') },
    { id_movimiento: 3, id_tipo: 2, descripcion: 'Compra de productos', fecha_generar: new Date('2025-10-22') },
    { id_movimiento: 4, id_tipo: 3, descripcion: 'Venta general', fecha_generar: new Date('2025-10-22') },
    { id_movimiento: 5, id_tipo: 1, descripcion: 'Devolución cliente', fecha_generar: new Date('2025-10-22') },
    { id_movimiento: 6, id_tipo: 2, descripcion: 'COMPRA mercancía', fecha_generar: new Date('2025-10-22') },
    { id_movimiento: 7, id_tipo: 2, descripcion: 'COMPRA mercancía', fecha_generar: new Date('2025-10-22') },
    { id_movimiento: 8, id_tipo: 3, descripcion: 'VENTA', fecha_generar: new Date('2025-10-22') },
    { id_movimiento: 9, id_tipo: 1, descripcion: 'Producto vencido', fecha_generar: new Date('2025-10-22') },
  ];
  for (const m of movimientosData) {
    await prisma.movimiento.upsert({
      where: { id_movimiento: m.id_movimiento },
      update: { id_tipo: m.id_tipo, descripcion: m.descripcion, fecha_generar: m.fecha_generar },
      create: m,
    });
  }
  console.log(`✓ Movimientos importados: ${movimientosData.length}`);

  // 8. PRODUCTOS (Limpiar productos adicionales y asegurar los 11 originales de mercapleno.sql)
  await prisma.cart_items.deleteMany({ where: { id_productos: { gt: 11 } } });
  await prisma.stock_actual.deleteMany({ where: { id_productos: { gt: 11 } } });
  await prisma.salida_productos.deleteMany({ where: { id_productos: { gt: 11 } } });
  await prisma.entrada_productos.deleteMany({ where: { id_productos: { gt: 11 } } });
  await prisma.venta_productos.deleteMany({ where: { id_productos: { gt: 11 } } });
  await prisma.productos.deleteMany({ where: { id_productos: { gt: 11 } } });

  const productosData = [
    {
      id_productos: 1,
      nombre: 'Arroz Diana 1000g',
      precio: 3500.00,
      id_categoria: 1,
      id_proveedor: 1,
      descripcion: 'Marca de arroz de alta calidad, seleccionada y cultivada para ofrecer granos blancos, sueltos y deliciosos.',
      estado: 'Disponible',
      imagen: 'https://exitocol.vtexassets.com/arquivos/ids/28955925/Arroz-Diana-1000-gr-552155_a.jpg?v=638864002504830000',
    },
    {
      id_productos: 2,
      nombre: 'Leche Alquería 1L',
      precio: 4200.00,
      id_categoria: 2,
      id_proveedor: 2,
      descripcion: 'Leche de alta calidad, frescura y con respaldo de un sello de calidad que no necesita hervirse y se puede consumir directamente del empaque.',
      estado: 'Disponible',
      imagen: 'https://carulla.vteximg.com.br/arquivos/ids/21758068/Leche-Entera-Cremosa-En-Bolsa-X-11-Litro-64343_a.jpg?v=638877710608300000',
    },
    {
      id_productos: 3,
      nombre: 'Carne de Res 500g',
      precio: 14500.00,
      id_categoria: 3,
      id_proveedor: 3,
      descripcion: 'Carne de res 100% fresca, seleccionada de ganado criado bajo estrictos estándares de calidad. Su textura tierna y jugosa la hace ideal para asados, guisos y parrillas.',
      estado: 'Disponible',
      imagen: 'https://res.cloudinary.com/dnvonflxi/image/upload/v1741755504/products/hbcxagibhpdvkaeukp8m.png',
    },
    {
      id_productos: 4,
      nombre: 'Coca-Cola 1.5L',
      precio: 4800.00,
      id_categoria: 4,
      id_proveedor: 4,
      descripcion: 'Refrescante y deliciosa, ideal para acompañar tus comidas favoritas.',
      estado: 'Disponible',
      imagen: 'https://product-images.farmatodo.com/8lPAboC9AiIl3ApU3iby9wX-oQ_mQy18Ac3AfVJTYU2DVvgdK1orI42eXPjwVVNlqgTt5n_m7XC2ZH_DvhRaS3gw4NmX3QIBsaJMry1Zunl4JRcJWg=s300-rw',
    },
    {
      id_productos: 5,
      nombre: 'Pan Bimbo Blanco',
      precio: 4600.00,
      id_categoria: 5,
      id_proveedor: 5,
      descripcion: 'Pan tajado blanco suave y fresco. Ideal para desayunos, merienda y sándwiches.',
      estado: 'Disponible',
      imagen: 'https://exitocol.vteximg.com.br/arquivos/ids/25464114/Pan-tajado-Actidefensis-BIMBO-600-gr-3107868_a.jpg?v=638666269317300000',
    },
    {
      id_productos: 6,
      nombre: 'Manzana Roja Kg',
      precio: 5200.00,
      id_categoria: 6,
      id_proveedor: 6,
      descripcion: 'Fruta natural fresca, dulce y crujiente ideal para consumir sola, jugos, ensaladas o postres.',
      estado: 'Disponible',
      imagen: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=80',
    },
    {
      id_productos: 7,
      nombre: 'Detergente Ariel 1Kg',
      precio: 12800.00,
      id_categoria: 7,
      id_proveedor: 7,
      descripcion: 'Limpieza profunda y cuidado de la ropa. Remueve manchas difíciles desde el primer lavado.',
      estado: 'Disponible',
      imagen: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80',
    },
    {
      id_productos: 8,
      nombre: 'Shampoo Savital 350ml',
      precio: 8700.00,
      id_categoria: 8,
      id_proveedor: 8,
      descripcion: 'Cuidado natural para tu cabello. Enriquecido con sábila y extractos naturales que nutren, fortalecen y dejan el cabello suave y brillante.',
      estado: 'Disponible',
      imagen: 'https://http2.mlstatic.com/D_NQ_NP_884079-MLU76991314497_062024-O.webp',
    },
    {
      id_productos: 9,
      nombre: 'Papas Margarita 160g',
      precio: 3200.00,
      id_categoria: 9,
      id_proveedor: 9,
      descripcion: 'Papas crocantes con sabor auténtico elaboradas con papas 100% naturales, fritas y sazonadas para ofrecer un sabor clásico.',
      estado: 'Disponible',
      imagen: 'https://mecato.shop/cdn/shop/products/papas-margarita-1.jpg?v=1643909363',
    },
    {
      id_productos: 10,
      nombre: 'Helado Crem Helado 1L',
      precio: 10500.00,
      id_categoria: 10,
      id_proveedor: 10,
      descripcion: 'Postre cremoso y refrescante elaborado con ingredientes de alta calidad.',
      estado: 'Disponible',
      imagen: 'https://cdn1.totalcommerce.cloud/cremhelado/product-zoom/es/vaso-1-litro-vainilla-1.webp',
    },
    {
      id_productos: 11,
      nombre: 'Pan Artesanal',
      precio: 12000.00,
      id_categoria: 5,
      id_proveedor: 5,
      descripcion: 'Pan artesanal grande recién horneado.',
      estado: 'Disponible',
      imagen: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
    },
  ];
  for (const p of productosData) {
    await prisma.productos.upsert({
      where: { id_productos: p.id_productos },
      update: {
        nombre: p.nombre,
        precio: p.precio,
        id_categoria: p.id_categoria,
        id_proveedor: p.id_proveedor,
        descripcion: p.descripcion,
        estado: p.estado,
        imagen: p.imagen,
      },
      create: p,
    });
  }
  console.log(`✓ Productos importados: ${productosData.length}`);

  // 9. USUARIOS
  const usuariosData = [
    {
      id: 1,
      nombre: 'Jeferson',
      apellido: 'Castro',
      email: 'jeferson@gmail.com',
      password: '$2b$10$zbVd416r7StggmQ1l6WYOuRlLkgJWOeyTVHHXoVGIOuQVuLHF3PoO',
      direccion: 'villa del rio',
      fecha_nacimiento: new Date('2006-02-08'),
      id_rol: 1,
      id_tipo_identificacion: 1,
      numero_identificacion: '1212121349',
      email_verified: true,
    },
    {
      id: 2,
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'juanR@gmail.com',
      password: '$2b$10$jR9XYWp2ERoLpy7/Lf7I9OZEoM2fAPzZMSa0vuSI0JdbUXJZPPCMK',
      direccion: 'villa del rio',
      fecha_nacimiento: new Date('2006-11-03'),
      id_rol: 2,
      id_tipo_identificacion: 1,
      numero_identificacion: '12334343',
      email_verified: true,
    },
    {
      id: 4,
      nombre: 'Dylan Sneider',
      apellido: 'Rivera Mora',
      email: 'elpepeyt@gmail.com',
      password: '$2a$10$whzWt1cZ5aZoMUpL.v6fQOvzEEfMZOW4Auh047yQXgIMB2g7OkeY2',
      direccion: 'diagonal 42 a sur #81h 09, villa de la torre, Kennedy, Bogota D.C',
      fecha_nacimiento: new Date('1999-09-09'),
      id_rol: 2,
      id_tipo_identificacion: 1,
      numero_identificacion: '66666666',
      email_verified: true,
    },
    {
      id: 6,
      nombre: 'Pablo',
      apellido: 'Rivero',
      email: 'pablo@gmail.com',
      password: '$2a$10$BlDDih/1lcUgG8H3kb/nUOqyJakWCsy4KryqVK2jJJ2PigqB5hQOK',
      direccion: 'villa del rio',
      fecha_nacimiento: new Date('2008-07-09'),
      id_rol: 3,
      id_tipo_identificacion: 1,
      numero_identificacion: '1233212343',
      email_verified: true,
    },
    {
      id: 8,
      nombre: 'Daniel',
      apellido: 'Lozano',
      email: 'daniel@gmail.com',
      password: '$2a$10$Cr8xAMObrJwR0rAI.UW9NOP184sPJOjseLmpOTOiWh4TGwtvxmLOa',
      direccion: 'puerta6',
      fecha_nacimiento: new Date('2006-12-31'),
      id_rol: 3,
      id_tipo_identificacion: 1,
      numero_identificacion: '10125555421',
      email_verified: true,
    },
    {
      id: 9,
      nombre: 'Pepito',
      apellido: 'Perez',
      email: 'pepe@gmail.com',
      password: '$2a$10$AMjFZq7E7CPWE1VhqUHh7ubsJvYYsJWtyDcwsiDzJtx3ZgdSC6G5a',
      direccion: 'villa del rio',
      fecha_nacimiento: new Date('2007-07-11'),
      id_rol: 3,
      id_tipo_identificacion: 1,
      numero_identificacion: '11323454',
      email_verified: true,
    },
    {
      id: 14,
      nombre: 'Usuario',
      apellido: 'Desconocido',
      email: 'usuario14@mercapleno.com',
      password: '$2a$10$KIX6aG5rMuejg0BD.7q9w.8KNCvT9LjouP8A3czVQHn0k.Tyn0WvG',
      direccion: 'desconocido',
      fecha_nacimiento: new Date('1990-01-01'),
      id_rol: 3,
      id_tipo_identificacion: 1,
      numero_identificacion: '0000000014',
      email_verified: true,
    },
    {
      id: 15,
      nombre: 'Yogui',
      apellido: 'Castro',
      email: 'jefersonjairbernalcastro172129@gmail.com',
      password: '$2a$10$65RcZUqiv.xO8MbUta7CEO9ZApYYo7/vwhwPeqsNMQAA5s9vvPXaC',
      direccion: 'calle 12 # 12',
      fecha_nacimiento: new Date('2000-05-21'),
      id_rol: 1,
      id_tipo_identificacion: 1,
      numero_identificacion: '21365487',
      email_verified: true,
    },
    {
      id: 16,
      nombre: 'Sebastian',
      apellido: 'Rivera',
      email: '5juansebas5@gmail.com',
      password: '$2a$10$fvqQp4Rmlx2Bq5c0K5kpl.7CTlkXB4PTum4N9p9SXe/zQC2Lk1s4C',
      direccion: 'calle 5# 12 norte',
      fecha_nacimiento: new Date('2007-05-10'),
      id_rol: 3,
      id_tipo_identificacion: 1,
      numero_identificacion: '123456789',
      email_verified: true,
    },
  ];
  for (const u of usuariosData) {
    await prisma.usuarios.upsert({
      where: { id: u.id },
      update: {
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        password: u.password,
        direccion: u.direccion,
        fecha_nacimiento: u.fecha_nacimiento,
        id_rol: u.id_rol,
        id_tipo_identificacion: u.id_tipo_identificacion,
        numero_identificacion: u.numero_identificacion,
        email_verified: u.email_verified,
      },
      create: u,
    });
  }
  console.log(`✓ Usuarios importados: ${usuariosData.length}`);

  // 10. STOCK ACTUAL
  const stockData = [
    { id_inventario: 1, id_productos: 1, id_movimiento: 1, stock: 116, fecha_vencimiento: new Date('2025-04-15') },
    { id_inventario: 2, id_productos: 2, id_movimiento: 1, stock: 105, fecha_vencimiento: new Date('2025-05-10') },
    { id_inventario: 3, id_productos: 3, id_movimiento: 2, stock: 104, fecha_vencimiento: new Date('2025-06-05') },
    { id_inventario: 4, id_productos: 4, id_movimiento: 2, stock: 21, fecha_vencimiento: new Date('2025-07-20') },
    { id_inventario: 5, id_productos: 5, id_movimiento: 1, stock: 69, fecha_vencimiento: new Date('2025-08-10') },
    { id_inventario: 6, id_productos: 6, id_movimiento: 2, stock: 57, fecha_vencimiento: new Date('2025-09-12') },
    { id_inventario: 7, id_productos: 7, id_movimiento: 5, stock: 123, fecha_vencimiento: new Date('2025-03-25') },
    { id_inventario: 8, id_productos: 8, id_movimiento: 1, stock: 82, fecha_vencimiento: new Date('2025-02-28') },
    { id_inventario: 9, id_productos: 9, id_movimiento: 2, stock: 80, fecha_vencimiento: new Date('2025-01-18') },
    { id_inventario: 10, id_productos: 10, id_movimiento: 5, stock: 125, fecha_vencimiento: new Date('2024-12-22') },
    { id_inventario: 11, id_productos: 11, id_movimiento: 1, stock: 50, fecha_vencimiento: new Date('2025-12-31') },
  ];
  for (const s of stockData) {
    await prisma.stock_actual.upsert({
      where: { id_inventario: s.id_inventario },
      update: {
        id_productos: s.id_productos,
        id_movimiento: s.id_movimiento,
        stock: s.stock,
        fecha_vencimiento: s.fecha_vencimiento,
      },
      create: s,
    });
  }
  console.log(`✓ Stock actual importado: ${stockData.length}`);

  // 11. ENTRADAS DE PRODUCTOS
  const entradasData = [
    { id_entrada: 1, id_productos: 3, cantidad: 1, fecha: new Date('2025-12-17'), observaciones: 'si', id_movimiento: 2, id_documento: 'fa', id_usuario: 1 },
    { id_entrada: 2, id_productos: 11, cantidad: 70, fecha: new Date('2025-12-17'), observaciones: 'nuevo pan', id_movimiento: 2, id_documento: 'cc', id_usuario: 1 },
    { id_entrada: 3, id_productos: 11, cantidad: 70, fecha: new Date('2025-12-17'), observaciones: 'pan', id_movimiento: 2, id_documento: 'cc', id_usuario: 1 },
    { id_entrada: 4, id_productos: 11, cantidad: 3, fecha: new Date('2026-02-02'), observaciones: '', id_movimiento: 2, id_documento: 'pe', id_usuario: 1 },
    { id_entrada: 5, id_productos: 3, cantidad: 3, fecha: new Date('2026-02-03'), observaciones: 'llegada de productos', id_movimiento: 2, id_documento: 'cc', id_usuario: 1 },
  ];
  for (const e of entradasData) {
    await prisma.entrada_productos.upsert({
      where: { id_entrada: e.id_entrada },
      update: e,
      create: e,
    });
  }
  console.log(`✓ Entradas de productos importadas: ${entradasData.length}`);

  // 12. SALIDAS DE PRODUCTOS
  const salidasData = [
    { id_salida: 1, id_productos: 4, cantidad: 2, fecha: new Date('2025-12-16'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 2, id_productos: 3, cantidad: 2, fecha: new Date('2025-12-16'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 3, id_productos: 9, cantidad: 1, fecha: new Date('2025-12-16'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 4, id_productos: 4, cantidad: 2, fecha: new Date('2025-12-16'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 5, id_productos: 3, cantidad: 1, fecha: new Date('2025-12-17'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 6, id_productos: 1, cantidad: 1, fecha: new Date('2025-12-17'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 7, id_productos: 10, cantidad: 1, fecha: new Date('2025-12-17'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 8, id_productos: 7, cantidad: 1, fecha: new Date('2025-12-17'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 9, id_productos: 4, cantidad: 2, fecha: new Date('2025-12-17'), id_documento: 'fa', id_usuario: 1, id_movimiento: 3 },
    { id_salida: 10, id_productos: 4, cantidad: 2, fecha: new Date('2025-12-17'), id_documento: 'CC', id_usuario: 6, id_movimiento: 2 },
    { id_salida: 11, id_productos: 7, cantidad: 2, fecha: new Date('2026-02-02'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 12, id_productos: 3, cantidad: 2, fecha: new Date('2026-02-02'), id_documento: 'CC', id_usuario: 4, id_movimiento: 2 },
    { id_salida: 13, id_productos: 1, cantidad: 32, fecha: new Date('2026-02-02'), id_documento: 've', id_usuario: 1, id_movimiento: 3 },
    { id_salida: 14, id_productos: 9, cantidad: 10, fecha: new Date('2026-02-02'), id_documento: 've', id_usuario: 1, id_movimiento: 3 },
    { id_salida: 15, id_productos: 4, cantidad: 1, fecha: new Date('2026-02-03'), id_documento: 'CC', id_usuario: 8, id_movimiento: 2 },
    { id_salida: 16, id_productos: 3, cantidad: 1, fecha: new Date('2026-02-03'), id_documento: 'CC', id_usuario: 8, id_movimiento: 2 },
    { id_salida: 17, id_productos: 7, cantidad: 1, fecha: new Date('2026-02-03'), id_documento: 'CC', id_usuario: 9, id_movimiento: 2 },
    { id_salida: 18, id_productos: 7, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 19, id_productos: 7, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 20, id_productos: 4, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 21, id_productos: 4, cantidad: 5, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 22, id_productos: 4, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 23, id_productos: 3, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 24, id_productos: 2, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 25, id_productos: 6, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 26, id_productos: 8, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 27, id_productos: 9, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 28, id_productos: 7, cantidad: 2, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 29, id_productos: 7, cantidad: 2, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 30, id_productos: 6, cantidad: 3, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 31, id_productos: 5, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 32, id_productos: 2, cantidad: 2, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 33, id_productos: 10, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 34, id_productos: 4, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 35, id_productos: 3, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 36, id_productos: 8, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 37, id_productos: 9, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 38, id_productos: 5, cantidad: 3, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 39, id_productos: 6, cantidad: 2, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 40, id_productos: 2, cantidad: 1, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, id_movimiento: 2 },
    { id_salida: 41, id_productos: 6, cantidad: 1, fecha: new Date('2026-02-09'), id_documento: 'CC', id_usuario: 15, id_movimiento: 2 },
  ];
  for (const s of salidasData) {
    await prisma.salida_productos.upsert({
      where: { id_salida: s.id_salida },
      update: s,
      create: s,
    });
  }
  console.log(`✓ Salidas de productos importadas: ${salidasData.length}`);

  // 13. VENTAS
  const ventasData = [
    { id_venta: 1, fecha: new Date('2025-12-16'), id_documento: 'CC', id_usuario: 4, total: 9600.00, id_metodo: 'M3' },
    { id_venta: 2, fecha: new Date('2025-12-16'), id_documento: 'CC', id_usuario: 4, total: 29000.00, id_metodo: 'M3' },
    { id_venta: 3, fecha: new Date('2025-12-16'), id_documento: 'CC', id_usuario: 4, total: 3200.00, id_metodo: 'M2' },
    { id_venta: 4, fecha: new Date('2025-12-16'), id_documento: 'CC', id_usuario: 4, total: 9600.00, id_metodo: 'M4' },
    { id_venta: 5, fecha: new Date('2025-12-17'), id_documento: 'CC', id_usuario: 4, total: 14800.00, id_metodo: 'M2' },
    { id_venta: 6, fecha: new Date('2025-12-17'), id_documento: 'CC', id_usuario: 4, total: 10500.00, id_metodo: 'M2' },
    { id_venta: 7, fecha: new Date('2025-12-17'), id_documento: 'CC', id_usuario: 4, total: 12800.00, id_metodo: 'M3' },
    { id_venta: 8, fecha: new Date('2025-12-17'), id_documento: 'CC', id_usuario: 6, total: 9600.00, id_metodo: 'M3' },
    { id_venta: 9, fecha: new Date('2026-02-02'), id_documento: 'CC', id_usuario: 4, total: 54600.00, id_metodo: 'M2' },
    { id_venta: 10, fecha: new Date('2026-02-03'), id_documento: 'CC', id_usuario: 8, total: 19300.00, id_metodo: 'M1' },
    { id_venta: 11, fecha: new Date('2026-02-03'), id_documento: 'CC', id_usuario: 9, total: 12800.00, id_metodo: 'M6' },
    { id_venta: 12, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, total: 12800.00, id_metodo: 'M1' },
    { id_venta: 13, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, total: 12800.00, id_metodo: 'M1' },
    { id_venta: 14, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, total: 4800.00, id_metodo: 'M1' },
    { id_venta: 15, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, total: 24000.00, id_metodo: 'M1' },
    { id_venta: 16, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, total: 40600.00, id_metodo: 'M1' },
    { id_venta: 17, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, total: 25600.00, id_metodo: 'M1' },
    { id_venta: 18, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, total: 95900.00, id_metodo: 'M1' },
    { id_venta: 19, fecha: new Date('2026-02-06'), id_documento: 'CC', id_usuario: 14, total: 28400.00, id_metodo: 'M5' },
    { id_venta: 20, fecha: new Date('2026-02-09'), id_documento: 'CC', id_usuario: 15, total: 5200.00, id_metodo: 'M1' },
  ];
  for (const v of ventasData) {
    await prisma.venta.upsert({
      where: { id_venta: v.id_venta },
      update: v,
      create: v,
    });
  }
  console.log(`✓ Ventas importadas: ${ventasData.length}`);

  // 14. VENTA PRODUCTOS (DETALLE DE VENTAS)
  const ventaProductosData = [
    { id_venta: 1, id_productos: 4, cantidad: 2, precio: 4800.00 },
    { id_venta: 2, id_productos: 3, cantidad: 2, precio: 14500.00 },
    { id_venta: 3, id_productos: 9, cantidad: 1, precio: 3200.00 },
    { id_venta: 4, id_productos: 4, cantidad: 2, precio: 4800.00 },
    { id_venta: 5, id_productos: 1, cantidad: 1, precio: 300.00 },
    { id_venta: 5, id_productos: 3, cantidad: 1, precio: 14500.00 },
    { id_venta: 6, id_productos: 10, cantidad: 1, precio: 10500.00 },
    { id_venta: 7, id_productos: 7, cantidad: 1, precio: 12800.00 },
    { id_venta: 8, id_productos: 4, cantidad: 2, precio: 4800.00 },
    { id_venta: 9, id_productos: 3, cantidad: 2, precio: 14500.00 },
    { id_venta: 9, id_productos: 7, cantidad: 2, precio: 12800.00 },
    { id_venta: 10, id_productos: 3, cantidad: 1, precio: 14500.00 },
    { id_venta: 10, id_productos: 4, cantidad: 1, precio: 4800.00 },
    { id_venta: 11, id_productos: 7, cantidad: 1, precio: 12800.00 },
    { id_venta: 12, id_productos: 7, cantidad: 1, precio: 12800.00 },
    { id_venta: 13, id_productos: 7, cantidad: 1, precio: 12800.00 },
    { id_venta: 14, id_productos: 4, cantidad: 1, precio: 4800.00 },
    { id_venta: 15, id_productos: 4, cantidad: 5, precio: 4800.00 },
    { id_venta: 16, id_productos: 2, cantidad: 1, precio: 4200.00 },
    { id_venta: 16, id_productos: 3, cantidad: 1, precio: 14500.00 },
    { id_venta: 16, id_productos: 4, cantidad: 1, precio: 4800.00 },
    { id_venta: 16, id_productos: 6, cantidad: 1, precio: 5200.00 },
    { id_venta: 16, id_productos: 8, cantidad: 1, precio: 8700.00 },
    { id_venta: 16, id_productos: 9, cantidad: 1, precio: 3200.00 },
    { id_venta: 17, id_productos: 7, cantidad: 2, precio: 12800.00 },
    { id_venta: 18, id_productos: 2, cantidad: 2, precio: 4200.00 },
    { id_venta: 18, id_productos: 3, cantidad: 1, precio: 14500.00 },
    { id_venta: 18, id_productos: 4, cantidad: 1, precio: 4800.00 },
    { id_venta: 18, id_productos: 5, cantidad: 1, precio: 4600.00 },
    { id_venta: 18, id_productos: 6, cantidad: 3, precio: 5200.00 },
    { id_venta: 18, id_productos: 7, cantidad: 2, precio: 12800.00 },
    { id_venta: 18, id_productos: 8, cantidad: 1, precio: 8700.00 },
    { id_venta: 18, id_productos: 9, cantidad: 1, precio: 3200.00 },
    { id_venta: 18, id_productos: 10, cantidad: 1, precio: 10500.00 },
    { id_venta: 19, id_productos: 2, cantidad: 1, precio: 4200.00 },
    { id_venta: 19, id_productos: 5, cantidad: 3, precio: 4600.00 },
    { id_venta: 19, id_productos: 6, cantidad: 2, precio: 5200.00 },
    { id_venta: 20, id_productos: 6, cantidad: 1, precio: 5200.00 },
  ];

  await prisma.venta_productos.deleteMany({});
  for (const vp of ventaProductosData) {
    await prisma.venta_productos.create({
      data: vp,
    });
  }
  console.log(`✓ Detalles de ventas importados: ${ventaProductosData.length}`);

  // 15. SINCRONIZAR TODAS LAS SECUENCIAS EN POSTGRESQL
  const tables = [
    { table: 'roles', pk: 'id' },
    { table: 'tipos_identificacion', pk: 'id' },
    { table: 'categoria', pk: 'id_categoria' },
    { table: 'proveedor', pk: 'id_proveedor' },
    { table: 'tipo_movimiento', pk: 'id_tipo' },
    { table: 'movimiento', pk: 'id_movimiento' },
    { table: 'productos', pk: 'id_productos' },
    { table: 'usuarios', pk: 'id' },
    { table: 'stock_actual', pk: 'id_inventario' },
    { table: 'entrada_productos', pk: 'id_entrada' },
    { table: 'salida_productos', pk: 'id_salida' },
    { table: 'venta', pk: 'id_venta' },
  ];

  for (const { table, pk } of tables) {
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('"${table}"', '${pk}'),
          coalesce((SELECT max("${pk}") FROM "${table}"), 1)
        );
      `);
    } catch (err) {
      console.warn(`Aviso de secuencia en ${table}:`, err.message);
    }
  }
  console.log('✓ Secuencias PostgreSQL actualizadas y sincronizadas');

  console.log('--- ¡Importación completa de la base de datos finalizada con éxito! ---');
}

importFullDatabase()
  .catch((e) => {
    console.error('Error importando base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

