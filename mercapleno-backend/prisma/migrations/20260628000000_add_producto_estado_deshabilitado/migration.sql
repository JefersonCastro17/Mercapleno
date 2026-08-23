-- Alter enum type for productos.estado to match Prisma schema
-- First convert any products with legacy states to 'Disponible'
UPDATE `productos` SET `estado` = 'Disponible' WHERE `estado` NOT IN ('Disponible', 'Agotado');

-- Then set the ENUM to the 3 supported values
ALTER TABLE `productos`
  MODIFY COLUMN `estado` ENUM('Disponible', 'Agotado', 'Deshabilitado') DEFAULT 'Disponible';
