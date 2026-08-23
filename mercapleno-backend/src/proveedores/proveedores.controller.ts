import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { ProveedoresService } from './proveedores.service';

@ApiTags('Proveedores')
@ApiBearerAuth()
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  /** GET /proveedores — Público: solo activos (para formularios y catálogos) */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar proveedores activos (con búsqueda opcional)' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.proveedoresService.findAll(search, true);
  }

  /** GET /proveedores/admin — Solo Admin: ve todos (activos e inactivos) */
  @Get('admin')
  @Roles(1)
  @ApiOperation({ summary: 'Listar todos los proveedores incluyendo deshabilitados (Admin)' })
  @ApiQuery({ name: 'search', required: false })
  findAllAdmin(@Query('search') search?: string) {
    return this.proveedoresService.findAllAdmin(search);
  }

  /** GET /proveedores/:id — Público */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  findOne(@Param('id') id: string) {
    return this.proveedoresService.findOne(id);
  }

  /** POST /proveedores — Solo Admin */
  @Post()
  @Roles(1)
  @ApiOperation({ summary: 'Crear proveedor (solo Admin)' })
  create(@Body() dto: CreateProveedorDto) {
    return this.proveedoresService.create(dto);
  }

  /** PATCH /proveedores/:id — Solo Admin */
  @Patch(':id')
  @Roles(1)
  @ApiOperation({ summary: 'Actualizar datos del proveedor (solo Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateProveedorDto) {
    return this.proveedoresService.update(id, dto);
  }

  /** PATCH /proveedores/:id/deshabilitar — Solo Admin: soft-delete, siempre posible */
  @Patch(':id/deshabilitar')
  @Roles(1)
  @ApiOperation({ summary: 'Deshabilitar proveedor (solo Admin). Funciona aunque tenga productos.' })
  deshabilitar(@Param('id') id: string) {
    return this.proveedoresService.deshabilitar(id);
  }

  /** PATCH /proveedores/:id/habilitar — Solo Admin: reactiva un proveedor */
  @Patch(':id/habilitar')
  @Roles(1)
  @ApiOperation({ summary: 'Habilitar proveedor previamente deshabilitado (solo Admin)' })
  habilitar(@Param('id') id: string) {
    return this.proveedoresService.habilitar(id);
  }

  /** DELETE /proveedores/:id — Solo Admin: eliminación física (falla si tiene productos) */
  @Delete(':id')
  @Roles(1)
  @ApiOperation({ summary: 'Eliminar proveedor (solo Admin). Falla si tiene productos; usa /deshabilitar en ese caso.' })
  remove(@Param('id') id: string) {
    return this.proveedoresService.remove(id);
  }
}
