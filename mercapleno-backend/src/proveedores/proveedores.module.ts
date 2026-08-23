import { Module } from '@nestjs/common';
import { ProveedoresController } from './proveedores.controller';
import { ProveedoresService } from './proveedores.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
  exports: [ProveedoresService],
})
export class ProveedoresModule {}
