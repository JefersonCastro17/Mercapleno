-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `login_two_factor_code` VARCHAR(64) NULL,
    ADD COLUMN `login_two_factor_expires` DATETIME(0) NULL;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_id_tipo_identificacion_fkey` FOREIGN KEY (`id_tipo_identificacion`) REFERENCES `tipos_identificacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
