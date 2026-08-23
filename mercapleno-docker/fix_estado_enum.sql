-- ============================================================
-- Corrección del ENUM 'estado' en la tabla productos
-- Ejecutar en la base de datos MySQL activa (Docker)
-- ============================================================

-- Paso 1: Convertir productos con estados legacy a 'Disponible'
UPDATE `productos`
SET `estado` = 'Disponible'
WHERE `estado` NOT IN ('Disponible', 'Agotado');

-- Paso 2: Redefinir el ENUM con los 3 valores correctos
ALTER TABLE `productos`
  MODIFY COLUMN `estado` ENUM('Disponible', 'Agotado', 'Deshabilitado') DEFAULT 'Disponible';

-- Verificación: mostrar los productos y sus estados
SELECT id_productos, nombre, estado FROM productos;
