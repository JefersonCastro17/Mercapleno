import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UsersAdminService } from './users-admin.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles(1) //validacion del rol
@ApiTags('Admin Users')
@ApiBearerAuth()
@ApiSecurity('x-api-key')
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly usersAdminService: UsersAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios administrativos' })
  findAll(@Query('search') search?: string) {
    return this.usersAdminService.findAll(search);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles disponibles' })
  findRoles() {
    return this.usersAdminService.findRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar usuario administrativo por ID' })
  findOne(@Param('id') id: string) {
    return this.usersAdminService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  create(@Body() dto: CreateUserAdminDto) {
    return this.usersAdminService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(@Param('id') id: string, @Body() dto: UpdateUserAdminDto) {
    return this.usersAdminService.update(id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar usuario (compatibilidad PUT)' })
  updatePut(@Param('id') id: string, @Body() dto: UpdateUserAdminDto) {
    return this.usersAdminService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  remove(@Param('id') id: string) {
    return this.usersAdminService.remove(id);
  }
}
