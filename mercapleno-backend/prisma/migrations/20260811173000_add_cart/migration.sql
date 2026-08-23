-- Create table cart
CREATE TABLE `cart` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `status` ENUM('active','ordered') NOT NULL DEFAULT 'active',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `cart_ibfk_user`(`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create table cart_items
CREATE TABLE `cart_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cart_id` INT NOT NULL,
  `id_productos` INT NOT NULL,
  `cantidad` INT NOT NULL,
  `price_snapshot` DECIMAL(12,2) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_cart_id`(`cart_id`),
  INDEX `idx_product_id`(`id_productos`),
  CONSTRAINT `cart_items_ibfk_cart` FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
