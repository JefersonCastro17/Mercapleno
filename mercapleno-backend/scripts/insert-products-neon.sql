-- ==========================================================
-- SCRIPT DE CARGA MASIVA DE PRODUCTOS PARA NEON TECH / POSTGRESQL
-- Mercapleno: Categorías, Proveedores, Productos con Fotos y Stock
-- ==========================================================

-- 1. Insertar categorías si no existen
INSERT INTO categoria (nombre)
SELECT c FROM (VALUES 
  ('Despensa'),
  ('Lácteos y Huevos'),
  ('Bebidas'),
  ('Aseo y Limpieza'),
  ('Snacks y Dulces'),
  ('Mascotas'),
  ('Frutas y Verduras')
) AS cats(c)
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre = cats.c);

-- 2. Insertar proveedores si no existen
INSERT INTO proveedor (nombre, apellido, telefono, activo)
SELECT p.nombre, p.apellido, p.telefono, true
FROM (VALUES
  ('Distribuciones', 'Andina', '3001002001'),
  ('Casa', 'Limpia', '3001002002'),
  ('Mercado', 'Central', '3001002003'),
  ('Pet', 'Friends', '3001002004'),
  ('Fresh', 'Goods', '3001002005'),
  ('Lácteos', 'del Valle', '3001002006')
) AS p(nombre, apellido, telefono)
WHERE NOT EXISTS (SELECT 1 FROM proveedor WHERE nombre = p.nombre AND apellido = p.apellido);

-- 3. Insertar productos y su stock inicial en lote
WITH nuevos_productos (nombre, precio, cat_nombre, prov_nombre, descripcion, imagen, stock_inicial) AS (
  VALUES
    ('Leche Entera 1L', 4800::numeric, 'Lácteos y Huevos', 'Lácteos', 'Leche entera ultrapasteurizada 100% pura de vaca.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80', 35),
    ('Huevos AA x30', 18500::numeric, 'Lácteos y Huevos', 'Mercado', 'Cubeta de huevos frescos seleccionados tamaño AA.', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80', 25),
    ('Aceite Vegetal 1L', 12500::numeric, 'Despensa', 'Distribuciones', 'Aceite vegetal refinado para todo tipo de preparaciones.', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80', 40),
    ('Arroz Premium 1 kg', 5600::numeric, 'Despensa', 'Distribuciones', 'Arroz de grano largo ideal para compras del hogar.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', 50),
    ('Pan Tajado Blanco', 6200::numeric, 'Despensa', 'Mercado', 'Pan de molde suave y esponjoso para sándwiches y desayunos.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 20),
    ('Café Molido Tradición 500g', 14500::numeric, 'Despensa', 'Mercado', 'Café 100% colombiano tostado y molido de aroma intenso.', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', 30),
    ('Azúcar Blanco 1 kg', 4500::numeric, 'Despensa', 'Distribuciones', 'Azúcar refinada de alta pureza.', 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=800&q=80', 45),
    ('Lentejas Seleccionadas 500g', 4200::numeric, 'Despensa', 'Distribuciones', 'Lentejas secas de rápida cocción y alto valor nutricional.', 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=800&q=80', 30),
    ('Atún en Aceite 170g', 7800::numeric, 'Despensa', 'Distribuciones', 'Lomitos de atún en aceite vegetal listos para consumir.', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', 60),
    ('Pasta Spaghetti 500g', 3800::numeric, 'Despensa', 'Distribuciones', 'Pasta de trigo fortificada ideal para almuerzos y cenas.', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80', 40),
    ('Queso Campesino 500g', 11200::numeric, 'Lácteos y Huevos', 'Lácteos', 'Queso fresco semigraso tradicional.', 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=800&q=80', 15),
    ('Yogurt Fresa 1L', 7400::numeric, 'Lácteos y Huevos', 'Lácteos', 'Bebida láctea con trozos de fruta y probióticos.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80', 25),
    ('Jugo de Naranja 1L', 6800::numeric, 'Bebidas', 'Fresh', 'Jugo natural de naranja pasteurizado sin azúcar añadido.', 'https://images.unsplash.com/photo-1600271886742-f049cd5bba3f?auto=format&fit=crop&w=800&q=80', 20),
    ('Agua Mineral 600ml', 2200::numeric, 'Bebidas', 'Fresh', 'Agua pura sin gas en botella individual.', 'https://images.unsplash.com/photo-1564419439288-bf6b4d2a7d6d?auto=format&fit=crop&w=800&q=80', 50),
    ('Gaseosa Cola 1.5L', 5500::numeric, 'Bebidas', 'Fresh', 'Bebida refrescante sabor cola con gas.', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80', 35),
    ('Cerveza Lata 330ml', 3800::numeric, 'Bebidas', 'Fresh', 'Cerveza rubia tipo lager de sabor equilibrado.', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80', 48),
    ('Detergente Líquido 2L', 24900::numeric, 'Aseo y Limpieza', 'Casa', 'Detergente concentrado para ropa blanca y de color.', 'https://images.unsplash.com/photo-1583947581924-a2b259f2e1ff?auto=format&fit=crop&w=800&q=80', 20),
    ('Jabón de Baño x3', 8900::numeric, 'Aseo y Limpieza', 'Casa', 'Jabón en barra antibacterial con hidratación para la piel.', 'https://images.unsplash.com/photo-1584305574647-acf2d3353f84?auto=format&fit=crop&w=800&q=80', 30),
    ('Papel Higiénico x12', 21500::numeric, 'Aseo y Limpieza', 'Casa', 'Papel higiénico doble hoja suave y resistente.', 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80', 25),
    ('Lavaloza Líquido 750ml', 7200::numeric, 'Aseo y Limpieza', 'Casa', 'Gel desengrasante con aroma a limón para vajillas y cubiertos.', 'https://images.unsplash.com/photo-1585670270608-b424214c721f?auto=format&fit=crop&w=800&q=80', 30),
    ('Desinfectante Multiusos 1L', 6500::numeric, 'Aseo y Limpieza', 'Casa', 'Limpiador de pisos y superficies con aroma a lavanda.', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80', 25),
    ('Papas Fritas Clásicas 115g', 4600::numeric, 'Snacks y Dulces', 'Mercado', 'Papas crujientes con un toque ideal de sal.', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80', 40),
    ('Galletas con Chips de Chocolate', 3900::numeric, 'Snacks y Dulces', 'Mercado', 'Galletas horneadas crujientes con chispas de chocolate.', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80', 35),
    ('Chocolate de Mesa 500g', 7200::numeric, 'Snacks y Dulces', 'Mercado', 'Pastillas de cacao tradicional para preparar chocolate caliente.', 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=800&q=80', 25),
    ('Manzana Roja 1 kg', 7800::numeric, 'Frutas y Verduras', 'Fresh', 'Manzanas frescas crujientes y dulces seleccionadas.', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80', 30),
    ('Plátano Maduro 1 kg', 3800::numeric, 'Frutas y Verduras', 'Fresh', 'Plátanos ideales para freír o asar.', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80', 35),
    ('Tomate Chonto 1 kg', 4200::numeric, 'Frutas y Verduras', 'Fresh', 'Tomates frescos para ensaladas y guisos.', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80', 40),
    ('Cebolla Cabezona 1 kg', 3600::numeric, 'Frutas y Verduras', 'Fresh', 'Cebolla fresca de primera calidad.', 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80', 30),
    ('Alimento para Perro 2 kg', 28900::numeric, 'Mascotas', 'Pet', 'Croquetas balanceadas para perros adultos con carne y cereales.', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80', 15),
    ('Arena Sanitaria para Gato 5 kg', 18400::numeric, 'Mascotas', 'Pet', 'Arena aglutinante con control de olores.', 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=800&q=80', 18)
),
ins_prod AS (
  INSERT INTO productos (nombre, precio, id_categoria, id_proveedor, descripcion, estado, imagen)
  SELECT 
    np.nombre,
    np.precio,
    c.id_categoria,
    p.id_proveedor,
    np.descripcion,
    'Disponible'::productos_estado,
    np.imagen
  FROM nuevos_productos np
  JOIN categoria c ON c.nombre = np.cat_nombre
  JOIN proveedor p ON p.nombre = np.prov_nombre
  WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = np.nombre)
  RETURNING id_productos, nombre
)
INSERT INTO stock_actual (id_productos, stock)
SELECT 
  ip.id_productos, 
  np.stock_inicial
FROM ins_prod ip
JOIN nuevos_productos np ON np.nombre = ip.nombre;

-- 4. Asegurar que cualquier producto existente que no tenga stock tenga al menos 15 unidades
INSERT INTO stock_actual (id_productos, stock)
SELECT p.id_productos, 15
FROM productos p
WHERE NOT EXISTS (SELECT 1 FROM stock_actual WHERE id_productos = p.id_productos);
