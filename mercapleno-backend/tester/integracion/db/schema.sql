
PRAGMA foreign_keys = ON;

-- 1. Roles del Sistema
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL
);

-- 2. Tipos de Identificación
CREATE TABLE IF NOT EXISTS tipos_identificacion (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL
);

-- 3. Categorías de Productos
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT
);

-- 4. Proveedores
CREATE TABLE IF NOT EXISTS proveedor (
  id_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  apellido TEXT,
  telefono TEXT,
  activo INTEGER DEFAULT 1
);

-- 5. Métodos de Pago
CREATE TABLE IF NOT EXISTS metodo (
  id_metodo TEXT PRIMARY KEY,
  metodo_pago TEXT
);

-- 6. Tipos de Movimiento
CREATE TABLE IF NOT EXISTS tipo_movimiento (
  id_tipo INTEGER PRIMARY KEY,
  nombre_movimiento TEXT,
  fecha_generar DATE
);

-- 7. Tipos de Devolución
CREATE TABLE IF NOT EXISTS tipo_devolucion (
  id_tipo_devolucion INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_tipo TEXT,
  descripcion TEXT
);

-- 8. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  direccion TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  id_rol INTEGER NOT NULL,
  id_tipo_identificacion INTEGER NOT NULL,
  numero_identificacion TEXT UNIQUE NOT NULL,
  email_verified INTEGER DEFAULT 0,
  email_verification_code TEXT,
  email_verification_expires DATETIME,
  password_reset_code TEXT,
  password_reset_expires DATETIME,
  login_two_factor_code TEXT,
  login_two_factor_expires DATETIME,
  FOREIGN KEY (id_rol) REFERENCES roles (id),
  FOREIGN KEY (id_tipo_identificacion) REFERENCES tipos_identificacion (id)
);

-- 9. Movimientos
CREATE TABLE IF NOT EXISTS movimiento (
  id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
  id_tipo INTEGER,
  descripcion TEXT,
  fecha_generar DATE,
  FOREIGN KEY (id_tipo) REFERENCES tipo_movimiento (id_tipo)
);

-- 10. Productos
CREATE TABLE IF NOT EXISTS productos (
  id_productos INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  precio REAL,
  id_categoria INTEGER,
  id_proveedor INTEGER,
  descripcion TEXT,
  estado TEXT DEFAULT 'Disponible',
  imagen TEXT,
  FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria),
  FOREIGN KEY (id_proveedor) REFERENCES proveedor (id_proveedor)
);

-- 11. Stock Actual
CREATE TABLE IF NOT EXISTS stock_actual (
  id_inventario INTEGER PRIMARY KEY AUTOINCREMENT,
  id_productos INTEGER,
  id_movimiento INTEGER,
  stock INTEGER,
  fecha_vencimiento DATE,
  FOREIGN KEY (id_productos) REFERENCES productos (id_productos),
  FOREIGN KEY (id_movimiento) REFERENCES movimiento (id_movimiento)
);

-- 12. Entrada de Productos
CREATE TABLE IF NOT EXISTS entrada_productos (
  id_entrada INTEGER PRIMARY KEY AUTOINCREMENT,
  id_productos INTEGER,
  cantidad INTEGER,
  fecha DATE,
  costo_unitario REAL,
  observaciones TEXT,
  id_movimiento INTEGER,
  id_documento TEXT,
  id_usuario INTEGER,
  FOREIGN KEY (id_productos) REFERENCES productos (id_productos),
  FOREIGN KEY (id_movimiento) REFERENCES movimiento (id_movimiento),
  FOREIGN KEY (id_usuario) REFERENCES usuarios (id)
);

-- 13. Salida de Productos
CREATE TABLE IF NOT EXISTS salida_productos (
  id_salida INTEGER PRIMARY KEY AUTOINCREMENT,
  id_productos INTEGER,
  cantidad INTEGER,
  fecha DATE,
  id_documento TEXT,
  id_usuario INTEGER,
  id_movimiento INTEGER,
  FOREIGN KEY (id_productos) REFERENCES productos (id_productos),
  FOREIGN KEY (id_usuario) REFERENCES usuarios (id),
  FOREIGN KEY (id_movimiento) REFERENCES movimiento (id_movimiento)
);

-- 14. Devolución de Productos
CREATE TABLE IF NOT EXISTS devolver_productos (
  id_devolucion INTEGER PRIMARY KEY AUTOINCREMENT,
  id_productos INTEGER,
  cantidad INTEGER,
  fecha DATE,
  metodo TEXT,
  id_tipo_devolucion INTEGER,
  id_tipo INTEGER,
  id_documento TEXT,
  FOREIGN KEY (id_productos) REFERENCES productos (id_productos),
  FOREIGN KEY (id_tipo_devolucion) REFERENCES tipo_devolucion (id_tipo_devolucion),
  FOREIGN KEY (id_tipo) REFERENCES tipo_movimiento (id_tipo)
);

-- 15. Ventas
CREATE TABLE IF NOT EXISTS venta (
  id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha DATE,
  id_documento TEXT,
  id_usuario INTEGER,
  total REAL,
  id_metodo TEXT,
  FOREIGN KEY (id_usuario) REFERENCES usuarios (id),
  FOREIGN KEY (id_metodo) REFERENCES metodo (id_metodo)
);

-- 16. Detalle de Venta (Venta Productos)
CREATE TABLE IF NOT EXISTS venta_productos (
  id_venta INTEGER,
  id_productos INTEGER,
  cantidad INTEGER,
  precio REAL,
  PRIMARY KEY (id_venta, id_productos),
  FOREIGN KEY (id_venta) REFERENCES venta (id_venta),
  FOREIGN KEY (id_productos) REFERENCES productos (id_productos)
);
