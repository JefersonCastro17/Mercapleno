import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

type UserWithRelations = Prisma.usuariosGetPayload<{
  include: { roles: true; tipos_identificacion: true };
}>;

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

  private handlePersistenceError(
    error: unknown,
    fallbackMessage: string,
    relationMessage: string,
  ): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = String(error.meta?.target || '');
        if (target.includes('email')) {
          throw new ConflictException({ success: false, message: 'El correo electronico ya esta registrado.' });
        }
        if (target.includes('numero_identificacion')) {
          throw new ConflictException({ success: false, message: 'El numero de identificacion ya esta registrado.' });
        }
        throw new ConflictException({ success: false, message: 'Ya existe un usuario con esos datos' });
      }

      if (error.code === 'P2003') {
        throw new ConflictException({ success: false, message: relationMessage });
      }
    }

    throw new InternalServerErrorException({ success: false, message: fallbackMessage });
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
      include: {
        roles: true,
        tipos_identificacion: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return {
      success: true,
      usuarios: usuarios.map((user: UserWithRelations) => ({
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        direccion: user.direccion,
        fecha_nacimiento: user.fecha_nacimiento,
        rol: user.roles?.nombre ?? null,
        tipo_identificacion: user.tipos_identificacion?.nombre ?? null,
        numero_identificacion: user.numero_identificacion,
        id_rol: user.id_rol,
        id_tipo_identificacion: user.id_tipo_identificacion,
      })),
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

  async findOne(id: string) {
    const userId = this.parseUserId(id);

    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        tipos_identificacion: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException({ success: false, message: 'Usuario no encontrado' });
    }

    return {
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        direccion: usuario.direccion,
        fecha_nacimiento: usuario.fecha_nacimiento,
        rol: usuario.roles?.nombre ?? null,
        tipo_identificacion: usuario.tipos_identificacion?.nombre ?? null,
        numero_identificacion: usuario.numero_identificacion,
        id_rol: usuario.id_rol,
        id_tipo_identificacion: usuario.id_tipo_identificacion,
        email_verified: usuario.email_verified,
      },
    };
  }

  async create(dto: CreateUserAdminDto) {
    const existingEmail = await this.prisma.usuarios.findFirst({
      where: { email: dto.email },
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
          nombre: dto.nombre,
          apellido: dto.apellido,
          email: dto.email,
          password: hashedPassword,
          direccion: dto.direccion,
          fecha_nacimiento: new Date(dto.fecha_nacimiento),
          id_rol: dto.id_rol,
          id_tipo_identificacion: dto.id_tipo_identificacion,
          numero_identificacion: dto.numero_identificacion,
          email_verified: dto.email_verified === false ? false : true,
        },
      });

      return { success: true, message: 'Usuario agregado correctamente' };
    } catch (error) {
      this.handlePersistenceError(
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

    if (dto.email !== undefined) {
      const emailConflict = await this.prisma.usuarios.findFirst({
        where: {
          email: dto.email,
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

    if (dto.numero_identificacion !== undefined) {
      const docConflict = await this.prisma.usuarios.findFirst({
        where: {
          numero_identificacion: dto.numero_identificacion,
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
      ...(dto.nombre !== undefined && String(dto.nombre).trim() !== '' ? { nombre: dto.nombre } : {}),
      ...(dto.apellido !== undefined && String(dto.apellido).trim() !== '' ? { apellido: dto.apellido } : {}),
      ...(dto.email !== undefined && String(dto.email).trim() !== '' ? { email: dto.email } : {}),
      ...(dto.direccion !== undefined && String(dto.direccion).trim() !== '' ? { direccion: dto.direccion } : {}),
      ...(dto.fecha_nacimiento !== undefined && String(dto.fecha_nacimiento).trim() !== ''
        ? { fecha_nacimiento: new Date(dto.fecha_nacimiento) }
        : {}),
      ...(dto.id_rol !== undefined ? { id_rol: dto.id_rol } : {}),
      ...(dto.id_tipo_identificacion !== undefined
        ? { id_tipo_identificacion: dto.id_tipo_identificacion }
        : {}),
      ...(dto.numero_identificacion !== undefined && String(dto.numero_identificacion).trim() !== ''
        ? { numero_identificacion: dto.numero_identificacion }
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
      this.handlePersistenceError(
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
      this.handlePersistenceError(
        error,
        'Error al eliminar usuario',
        'No se puede eliminar el usuario porque tiene registros asociados',
      );
    }

    return { success: true, message: 'Usuario eliminado correctamente' };
  }
}
