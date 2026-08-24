import { Test, TestingModule } from '@nestjs/testing';
import { UsersAdminService } from '../../../src/users-admin/users-admin.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

describe('UsersAdminService (Unitarias)', () => {
  let service: UsersAdminService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersAdminService,
        {
          provide: PrismaService,
          useValue: {
            usuarios: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            roles: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersAdminService>(UsersAdminService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseUserId & Validaciones de ID', () => {
    it('debe lanzar BadRequestException si el id no es un número válido o <= 0', async () => {
      await expect(service.findOne('invalido')).rejects.toThrow(BadRequestException);
      await expect(service.findOne('-5')).rejects.toThrow(BadRequestException);
      await expect(service.findOne('0')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findRoles', () => {
    it('debe retornar la lista de roles ordenados', async () => {
      const mockRoles = [
        { id: 1, nombre: 'Admin' },
        { id: 2, nombre: 'Gerente' },
      ];
      jest.spyOn(prismaService.roles, 'findMany').mockResolvedValue(mockRoles as any);

      const result = await service.findRoles();

      expect(prismaService.roles.findMany).toHaveBeenCalledWith({ orderBy: { id: 'asc' } });
      expect(result).toEqual({
        success: true,
        roles: mockRoles,
      });
    });
  });

  describe('Crear Usuario (Admin)', () => {
    const createUserDto = {
      nombre: 'Admin',
      apellido: 'User',
      email: 'Admin@Test.com',
      password: 'Password123!',
      direccion: 'Admin St',
      fecha_nacimiento: '1990-01-01',
      id_rol: 2,
      id_tipo_identificacion: 1,
      numero_identificacion: '987654321',
      email_verified: true,
    };

    it('CP-049 - debe registrar correctamente un nuevo usuario con datos válidos', async () => {
      const findFirstSpy = jest.spyOn(prismaService.usuarios, 'findFirst');
      findFirstSpy.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hash' as never);
      const createSpy = jest.spyOn(prismaService.usuarios, 'create').mockResolvedValue({ id: 1 } as any);

      const result = await service.create(createUserDto);

      expect(findFirstSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
        where: { email: 'admin@test.com' },
        select: { id: true },
      }));
      expect(findFirstSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
        where: { numero_identificacion: createUserDto.numero_identificacion },
        select: { id: true },
      }));
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          id_rol: createUserDto.id_rol,
          email: 'admin@test.com',
          numero_identificacion: createUserDto.numero_identificacion,
        }),
      }));
      expect(result).toEqual({ success: true, message: 'Usuario agregado correctamente' });
    });

    it('CP-050 - debe rechazar si el correo electrónico ya está registrado', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({ id: 1 } as any);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('CP-051 - debe rechazar si el número de identificación ya está registrado', async () => {
      const findFirstSpy = jest.spyOn(prismaService.usuarios, 'findFirst');
      findFirstSpy.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 2 } as any);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('debe manejar error P2002 de Prisma al crear usuario', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hash' as never);
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: 'email' },
      });
      jest.spyOn(prismaService.usuarios, 'create').mockRejectedValue(p2002Error);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('debe manejar error P2003 de Prisma al crear usuario por rol o tipo_identificacion inexistente', async () => {
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hash' as never);
      const p2003Error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint', {
        code: 'P2003',
        clientVersion: '6.0.0',
      });
      jest.spyOn(prismaService.usuarios, 'create').mockRejectedValue(p2003Error);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('RF-002.2 Consultar Usuario', () => {
    it('CP-055 - debe consultar el listado de usuarios registrados', async () => {
      jest.spyOn(prismaService.usuarios, 'findMany').mockResolvedValue([
        {
          id: 1,
          nombre: 'Admin',
          apellido: 'User',
          email: 'admin@test.com',
          direccion: 'Calle 1',
          fecha_nacimiento: new Date('1990-01-01'),
          id_rol: 1,
          id_tipo_identificacion: 1,
          numero_identificacion: '123',
          roles: { id: 1, nombre: 'Admin' },
          tipos_identificacion: { id: 1, nombre: 'CC' },
        },
      ] as any);

      const result = await service.findAll('');

      expect(prismaService.usuarios.findMany).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.usuarios.length).toBe(1);
      expect(result.usuarios[0].rol).toBe('Admin');
    });

    it('CP-056 - debe buscar usuarios con criterio de búsqueda', async () => {
      jest.spyOn(prismaService.usuarios, 'findMany').mockResolvedValue([]);

      const result = await service.findAll('criterio_busqueda');

      expect(prismaService.usuarios.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
      expect(result).toEqual({
        success: true,
        usuarios: [],
      });
    });

    it('debe obtener un usuario por ID', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({
        id: 1,
        nombre: 'Admin',
        apellido: 'User',
        email: 'admin@test.com',
        direccion: 'Calle 1',
        fecha_nacimiento: new Date('1990-01-01'),
        id_rol: 1,
        id_tipo_identificacion: 1,
        numero_identificacion: '123',
        email_verified: true,
        roles: { id: 1, nombre: 'Admin' },
        tipos_identificacion: { id: 1, nombre: 'CC' },
      } as any);

      const result = await service.findOne('1');

      expect(result.success).toBe(true);
      expect(result.usuario.id).toBe(1);
      expect(result.usuario.rol).toBe('Admin');
    });

    it('debe lanzar NotFoundException si el usuario no existe en findOne', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('RF-002.3 Editar Usuario', () => {
    it('CP-058 - debe actualizar correctamente la información de un usuario', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({ id: 1 } as any);

      const result = await service.update('1', {
        nombre: 'Nuevo',
        apellido: 'Usuario',
        email: 'nuevo@test.com',
        direccion: 'Direccion Nueva',
        fecha_nacimiento: '1995-05-05',
        id_rol: 2,
        id_tipo_identificacion: 2,
        numero_identificacion: '55555',
      });

      expect(prismaService.usuarios.update).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Usuario actualizado correctamente',
      });
    });

    it('debe actualizar la contraseña encriptándola cuando se provee', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed_pwd' as never);
      jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue({ id: 1 } as any);

      const result = await service.update('1', {
        password: 'NewSecurePassword123!',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewSecurePassword123!', 10);
      expect(prismaService.usuarios.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'new_hashed_pwd',
          }),
        }),
      );
      expect(result).toEqual({
        success: true,
        message: 'Usuario actualizado correctamente',
      });
    });

    it('debe lanzar NotFoundException si el usuario a actualizar no existe', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);

      await expect(service.update('999', { nombre: 'Test' })).rejects.toThrow(NotFoundException);
    });

    it('CP-059 - debe impedir actualizar un correo registrado por otro usuario', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({ id: 2 } as any);

      await expect(service.update('1', { email: 'exist@test.com' })).rejects.toThrow(ConflictException);
    });

    it('CP-060 - debe impedir actualizar un número de identificación registrado por otro usuario', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(prismaService.usuarios, 'findFirst').mockResolvedValue({ id: 2 } as any);

      await expect(service.update('1', { numero_identificacion: '222222222' })).rejects.toThrow(ConflictException);
    });

    it('CP-061 - debe devolver sin cambios si no hay campos que actualizar', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({ id: 1 } as any);

      const result = await service.update('1', {
        nombre: '',
        apellido: '',
      });

      expect(result).toEqual({
        success: true,
        message: 'Sin cambios para actualizar',
      });
    });

    it('debe manejar error P2003 de Prisma al actualizar usuario', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({ id: 1 } as any);
      const p2003Error = new Prisma.PrismaClientKnownRequestError('Foreign key', {
        code: 'P2003',
        clientVersion: '6.0.0',
      });
      jest.spyOn(prismaService.usuarios, 'update').mockRejectedValue(p2003Error);

      await expect(service.update('1', { id_rol: 99 })).rejects.toThrow(ConflictException);
    });
  });

  describe('RF-002.4 Eliminar Usuario', () => {
    it('CP-063 - debe eliminar correctamente un usuario que no tiene registros asociados', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(prismaService.usuarios, 'delete').mockResolvedValue({ id: 1 } as any);

      const result = await service.remove('1');

      expect(prismaService.usuarios.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        success: true,
        message: 'Usuario eliminado correctamente',
      });
    });

    it('debe lanzar NotFoundException si el usuario a eliminar no existe', async () => {
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('CP-064 - debe impedir eliminar un usuario que tiene registros asociados (P2003)', async () => {
      const relationError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '6.0.0',
      });

      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(prismaService.usuarios, 'delete').mockRejectedValue(relationError);

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
    });
  });
});
