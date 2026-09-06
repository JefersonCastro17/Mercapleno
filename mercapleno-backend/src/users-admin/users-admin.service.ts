import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaPersistenceError } from '../common/utils/prisma-error.util';
import { mapAdminUserResponse, RawUserWithRelations } from '../common/utils/user-mapper.util';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

const USER_SELECT_PROJECTION = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  direccion: true,
  fecha_nacimiento: true,
  id_rol: true,
  id_tipo_identificacion: true,
  numero_identificacion: true,
  email_verified: true,
  roles: {
    select: {
      id: true,
      nombre: true,
    },
  },
  tipos_identificacion: {
    select: {
      id: true,
      nombre: true,
    },
  },
} as const;

@Injectable()
export class UsersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private parseUserId(id: string): number {
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException({ success: false, message: 'Id de usuario invalido' });
    }

    return userId;
  }

  private normalizeEmail(email?: string): string {
    return email ? email.trim().toLowerCase() : '';
  }

  async findAll(search?: string) {
    const where: Prisma.usuariosWhereInput = {};

    if (search) {
      const cleanSearch = search.trim();
      where.OR = [
        { nombre: { contains: cleanSearch } },
        { apellido: { contains: cleanSearch } },
        { email: { contains: cleanSearch } },
        { numero_identificacion: { contains: cleanSearch } },
        { roles: { nombre: { contains: cleanSearch } } },
      ];
    }

    const usuarios = await this.prisma.usuarios.findMany({
      where,
      select: USER_SELECT_PROJECTION,
      orderBy: {
        id: 'asc',
      },
    });

    return {
      success: true,
      usuarios: usuarios.map((user: RawUserWithRelations) => mapAdminUserResponse(user)),
    };
  }

  async findRoles() {
    const roles = await this.prisma.roles.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    return {
      success: true,
      roles: roles.map((role) => ({
        id: role.id,
        nombre: role.nombre,
      })),
    };
  }

  async findDocumentTypes() {
    const tipos = await this.prisma.tipos_identificacion.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    return {
      success: true,
      tipos_identificacion: tipos.map((tipo) => ({
        id: tipo.id,
        nombre: tipo.nombre,
      })),
    };
  }

  async findOne(id: string) {
    const userId = this.parseUserId(id);

    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: userId },
      select: USER_SELECT_PROJECTION,
    });

    if (!usuario) {
      throw new NotFoundException({ success: false, message: 'Usuario no encontrado' });
    }

    return {
      success: true,
      usuario: mapAdminUserResponse(usuario as RawUserWithRelations),
    };
  }


  async create(dto: CreateUserAdminDto) {
    const email = this.normalizeEmail(dto.email);
    const existingEmail = await this.prisma.usuarios.findFirst({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      throw new ConflictException({
        success: false,
        message: 'El correo electronico ya esta registrado.',
      });
    }

    const existingDoc = await this.prisma.usuarios.findFirst({
      where: { numero_identificacion: dto.numero_identificacion },
      select: { id: true },
    });

    if (existingDoc) {
      throw new ConflictException({
        success: false,
        message: 'El numero de identificacion ya esta registrado.',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      await this.prisma.usuarios.create({
        data: {
          nombre: dto.nombre.trim(),
          apellido: dto.apellido.trim(),
          email,
          password: hashedPassword,
          direccion: dto.direccion.trim(),
          fecha_nacimiento: new Date(dto.fecha_nacimiento),
          id_rol: dto.id_rol,
          id_tipo_identificacion: dto.id_tipo_identificacion,
          numero_identificacion: dto.numero_identificacion.trim(),
          email_verified: dto.email_verified !== false,
        },
      });

      return { success: true, message: 'Usuario agregado correctamente' };
    } catch (error) {
      handlePrismaPersistenceError(
        error,
        'Error al insertar usuario',
        'No se pudo crear el usuario porque el rol o el tipo de identificacion no existen',
      );
    }
  }

  async update(id: string, dto: UpdateUserAdminDto) {
    const userId = this.parseUserId(id);
    const existing = await this.prisma.usuarios.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException({ success: false, message: 'Usuario no encontrado' });
    }

    if (dto.email !== undefined && dto.email.trim() !== '') {
      const email = this.normalizeEmail(dto.email);
      const emailConflict = await this.prisma.usuarios.findFirst({
        where: {
          email,
          id: { not: userId },
        },
        select: { id: true },
      });

      if (emailConflict) {
        throw new ConflictException({
          success: false,
          message: 'El correo electronico ya esta registrado.',
        });
      }
    }

    if (dto.numero_identificacion !== undefined && dto.numero_identificacion.trim() !== '') {
      const docConflict = await this.prisma.usuarios.findFirst({
        where: {
          numero_identificacion: dto.numero_identificacion.trim(),
          id: { not: userId },
        },
        select: { id: true },
      });

      if (docConflict) {
        throw new ConflictException({
          success: false,
          message: 'El numero de identificacion ya esta registrado.',
        });
      }
    }

    const data: Prisma.usuariosUpdateInput = {
      ...(dto.nombre !== undefined && String(dto.nombre).trim() !== '' ? { nombre: dto.nombre.trim() } : {}),
      ...(dto.apellido !== undefined && String(dto.apellido).trim() !== '' ? { apellido: dto.apellido.trim() } : {}),
      ...(dto.email !== undefined && String(dto.email).trim() !== '' ? { email: this.normalizeEmail(dto.email) } : {}),
      ...(dto.direccion !== undefined && String(dto.direccion).trim() !== '' ? { direccion: dto.direccion.trim() } : {}),
      ...(dto.fecha_nacimiento !== undefined && String(dto.fecha_nacimiento).trim() !== ''
        ? { fecha_nacimiento: new Date(dto.fecha_nacimiento) }
        : {}),
      ...(dto.id_rol !== undefined ? { id_rol: dto.id_rol } : {}),
      ...(dto.id_tipo_identificacion !== undefined
        ? { id_tipo_identificacion: dto.id_tipo_identificacion }
        : {}),
      ...(dto.numero_identificacion !== undefined && String(dto.numero_identificacion).trim() !== ''
        ? { numero_identificacion: dto.numero_identificacion.trim() }
        : {}),
    };

    if (dto.password !== undefined && String(dto.password).trim() !== '') {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(data).length === 0) {
      return { success: true, message: 'Sin cambios para actualizar' };
    }

    try {
      await this.prisma.usuarios.update({
        where: { id: userId },
        data,
      });
    } catch (error) {
      handlePrismaPersistenceError(
        error,
        'Error al actualizar usuario',
        'No se pudo actualizar el usuario porque el rol o el tipo de identificacion no existen',
      );
    }

    return { success: true, message: 'Usuario actualizado correctamente' };
  }

  async remove(id: string) {
    const userId = this.parseUserId(id);
    const existing = await this.prisma.usuarios.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException({ success: false, message: 'Usuario no encontrado' });
    }

    try {
      await this.prisma.usuarios.delete({
        where: { id: userId },
      });
    } catch (error) {
      handlePrismaPersistenceError(
        error,
        'Error al eliminar usuario',
        'No se puede eliminar el usuario porque tiene registros asociados',
      );
    }

    return { success: true, message: 'Usuario eliminado correctamente' };
  }
}
