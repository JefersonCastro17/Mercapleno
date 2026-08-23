
-- 1. Roles
INSERT OR REPLACE INTO roles (id, nombre) VALUES
(1, 'Administrador'),
(2, 'Empleado'),
(3, 'Cliente');

-- 2. Tipos de Identificación
INSERT OR REPLACE INTO tipos_identificacion (id, nombre) VALUES
(1, 'Cedula de ciudadania'),
(2, 'Tarjeta de identidad'),
(3, 'Cedula de extranjeria'),
(4, 'Pasaporte'),
(5, 'NIT');

-- 3. Métodos de Pago
INSERT OR REPLACE INTO metodo (id_metodo, metodo_pago) VALUES
('M1', 'Efectivo'),
('M2', 'Tarjeta de Credito'),
('M3', 'Tarjeta de Debito'),
('M4', 'Transferencia'),
('M5', 'Nequi'),
('M6', 'Daviplata');

-- 4. Tipos de Movimiento
INSERT OR REPLACE INTO tipo_movimiento (id_tipo, nombre_movimiento, fecha_generar) VALUES
(1, 'ENTRADA', CURRENT_DATE),
(2, 'SALIDA', CURRENT_DATE);

-- 5. Movimientos Base
INSERT OR REPLACE INTO movimiento (id_movimiento, id_tipo, descripcion, fecha_generar) VALUES
(2, 1, 'ENTRADA INVENTARIO', CURRENT_DATE),
(3, 2, 'SALIDA INVENTARIO', CURRENT_DATE);

-- 6. Usuario Administrador por Defecto (Password: Admin123*)
-- Hash bcrypt de 10 rondas para 'Admin123*'
INSERT OR REPLACE INTO usuarios (
  id, nombre, apellido, email, password, direccion, 
  fecha_nacimiento, id_rol, id_tipo_identificacion, 
  numero_identificacion, email_verified
) VALUES (
  1, 
  'Admin', 
  'Mercapleno', 
  'admin@mercapleno.local', 
  '$2a$10$d4vQf88mS1E5Yg5YjW2vneHqA3h7B5b0.47j7eO608F8fR198f26a', 
  'Panel administrativo', 
  '1990-01-01', 
  1, 
  1, 
  '1000000001', 
  1
);
