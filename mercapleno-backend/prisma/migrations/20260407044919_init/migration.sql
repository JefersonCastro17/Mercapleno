-- CreateTable
CREATE TABLE `categoria` (
    `id_categoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(30) NULL,

    PRIMARY KEY (`id_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `devolver_productos` (
    `id_devolucion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_productos` INTEGER NULL,
    `cantidad` INTEGER NULL,
    `fecha` DATE NULL,
    `metodo` VARCHAR(100) NULL,
    `id_tipo_devolucion` INTEGER NULL,
    `id_tipo` INTEGER NULL,
    `id_documento` CHAR(2) NULL,

    INDEX `fk_dev_prod`(`id_productos`),
    INDEX `fk_dev_tipo_devolucion`(`id_tipo_devolucion`),
    INDEX `fk_dev_tipo_movimiento`(`id_tipo`),
    PRIMARY KEY (`id_devolucion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entrada_productos` (
    `id_entrada` INTEGER NOT NULL AUTO_INCREMENT,
    `id_productos` INTEGER NULL,
    `cantidad` INTEGER NULL,
    `fecha` DATE NULL,
    `costo_unitario` DECIMAL(10, 2) NULL,
    `observaciones` VARCHAR(100) NULL,
    `id_movimiento` INTEGER NULL,
    `id_documento` CHAR(2) NULL,
    `id_usuario` INTEGER NULL,

    INDEX `entrada_productos_ibfk_1`(`id_productos`),
    INDEX `entrada_productos_ibfk_2`(`id_movimiento`),
    INDEX `entrada_productos_ibfk_3`(`id_usuario`),
    PRIMARY KEY (`id_entrada`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metodo` (
    `id_metodo` CHAR(2) NOT NULL,
    `metodo_pago` VARCHAR(42) NULL,

    PRIMARY KEY (`id_metodo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimiento` (
    `id_movimiento` INTEGER NOT NULL AUTO_INCREMENT,
    `id_tipo` INTEGER NULL,
    `descripcion` VARCHAR(100) NULL,
    `fecha_generar` DATE NULL,

    INDEX `movimiento_ibfk_1`(`id_tipo`),
    PRIMARY KEY (`id_movimiento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id_productos` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NULL,
    `precio` DECIMAL(12, 2) NULL,
    `id_categoria` INTEGER NULL,
    `id_proveedor` INTEGER NULL,
    `descripcion` VARCHAR(255) NULL,
    `estado` ENUM('Disponible', 'Agotado') NULL DEFAULT 'Disponible',
    `imagen` VARCHAR(255) NULL,

    INDEX `productos_ibfk_1`(`id_categoria`),
    INDEX `productos_ibfk_2`(`id_proveedor`),
    PRIMARY KEY (`id_productos`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proveedor` (
    `id_proveedor` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NULL,
    `apellido` VARCHAR(50) NULL,
    `telefono` VARCHAR(20) NULL,

    PRIMARY KEY (`id_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salida_productos` (
    `id_salida` INTEGER NOT NULL AUTO_INCREMENT,
    `id_productos` INTEGER NULL,
    `cantidad` INTEGER NULL,
    `fecha` DATE NULL,
    `id_documento` CHAR(2) NULL,
    `id_usuario` INTEGER NULL,
    `id_movimiento` INTEGER NULL,

    INDEX `salida_productos_ibfk_1`(`id_productos`),
    INDEX `salida_productos_ibfk_2`(`id_usuario`),
    INDEX `salida_productos_ibfk_3`(`id_movimiento`),
    PRIMARY KEY (`id_salida`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_actual` (
    `id_inventario` INTEGER NOT NULL AUTO_INCREMENT,
    `id_productos` INTEGER NULL,
    `id_movimiento` INTEGER NULL,
    `stock` INTEGER NULL,
    `fecha_vencimiento` DATE NULL,

    INDEX `stock_actual_ibfk_1`(`id_productos`),
    INDEX `stock_actual_ibfk_2`(`id_movimiento`),
    PRIMARY KEY (`id_inventario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_devolucion` (
    `id_tipo_devolucion` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_tipo` VARCHAR(30) NULL,
    `descripcion` VARCHAR(100) NULL,

    PRIMARY KEY (`id_tipo_devolucion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_movimiento` (
    `id_tipo` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_movimiento` VARCHAR(20) NULL,
    `fecha_generar` DATE NULL,

    PRIMARY KEY (`id_tipo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipos_identificacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `fecha_nacimiento` DATE NOT NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `id_rol` INTEGER NOT NULL,
    `id_tipo_identificacion` INTEGER NOT NULL,
    `numero_identificacion` VARCHAR(50) NOT NULL,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `email_verification_code` VARCHAR(64) NULL,
    `email_verification_expires` DATETIME(0) NULL,
    `password_reset_code` VARCHAR(64) NULL,
    `password_reset_expires` DATETIME(0) NULL,

    INDEX `usuarios_ibfk_1`(`id_rol`),
    INDEX `usuarios_ibfk_2`(`id_tipo_identificacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `venta` (
    `id_venta` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NULL,
    `id_documento` CHAR(2) NULL,
    `id_usuario` INTEGER NULL,
    `total` DECIMAL(12, 2) NULL,
    `id_metodo` CHAR(2) NULL,

    INDEX `venta_ibfk_1`(`id_usuario`),
    INDEX `venta_ibfk_2`(`id_metodo`),
    PRIMARY KEY (`id_venta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `venta_productos` (
    `id_venta` INTEGER NOT NULL,
    `id_productos` INTEGER NOT NULL,
    `cantidad` INTEGER NULL,
    `precio` DECIMAL(10, 2) NOT NULL,

    INDEX `venta_productos_ibfk_2`(`id_productos`),
    PRIMARY KEY (`id_venta`, `id_productos`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `devolver_productos` ADD CONSTRAINT `fk_dev_prod` FOREIGN KEY (`id_productos`) REFERENCES `productos`(`id_productos`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `devolver_productos` ADD CONSTRAINT `fk_dev_tipo_devolucion` FOREIGN KEY (`id_tipo_devolucion`) REFERENCES `tipo_devolucion`(`id_tipo_devolucion`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `devolver_productos` ADD CONSTRAINT `fk_dev_tipo_movimiento` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_movimiento`(`id_tipo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `entrada_productos` ADD CONSTRAINT `entrada_productos_ibfk_1` FOREIGN KEY (`id_productos`) REFERENCES `productos`(`id_productos`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `entrada_productos` ADD CONSTRAINT `entrada_productos_ibfk_2` FOREIGN KEY (`id_movimiento`) REFERENCES `movimiento`(`id_movimiento`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `entrada_productos` ADD CONSTRAINT `entrada_productos_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento` ADD CONSTRAINT `movimiento_ibfk_1` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_movimiento`(`id_tipo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE RESTRICT;
