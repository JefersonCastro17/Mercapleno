import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { CreateProveedorDto } from '../../../src/proveedores/dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../../../src/proveedores/dto/update-proveedor.dto';

describe('ProveedoresService (Unitarias)', () => {
  let service: ProveedoresService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    proveedor: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProveedoresService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProveedoresService>(ProveedoresService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // PARSE ID & VALIDACIONES PRIVADAS
  // =========================================================================
  describe('Validaciones privadas y parseId', () => {
    it('debe parsear un ID numérico válido', () => {
      expect((service as any).parseId('10')).toBe(10);
    });

    it('debe lanzar BadRequestException si el ID no es un número entero positivo', () => {
      expect(() => (service as any).parseId('abc')).toThrow(BadRequestException);
      expect(() => (service as any).parseId('-5')).toThrow(BadRequestException);
      expect(() => (service as any).parseId('0')).toThrow(BadRequestException);
      expect(() => (service as any).parseId('2.5')).toThrow(BadRequestException);
    });

    it('debe validar texto correctamente y recortar espacios', () => {
      expect((service as any).validateTexto('  Lácteos  ', 'nombre')).toBe('Lácteos');
    });

    it('debe lanzar BadRequestException si el texto está vacío o contiene solo espacios', () => {
      expect(() => (service as any).validateTexto('', 'nombre')).toThrow(BadRequestException);
      expect(() => (service as any).validateTexto('   ', 'apellido')).toThrow(BadRequestException);
      expect(() => (service as any).validateTexto(undefined, 'nombre')).toThrow(BadRequestException);
    });

    it('debe validar un teléfono correcto de 10 dígitos', () => {
      expect((service as any).validateTelefono('3001234567')).toBe('3001234567');
      expect((service as any).validateTelefono('  3001234567  ')).toBe('3001234567');
    });

    it('debe lanzar BadRequestException si el teléfono está vacío o no tiene 10 dígitos', () => {
      expect(() => (service as any).validateTelefono('')).toThrow(BadRequestException);
      expect(() => (service as any).validateTelefono(null)).toThrow(BadRequestException);
      expect(() => (service as any).validateTelefono('12345')).toThrow(BadRequestException);
      expect(() => (service as any).validateTelefono('300123456789')).toThrow(BadRequestException);
      expect(() => (service as any).validateTelefono('300123456a')).toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException si el teléfono ya está registrado en checkTelefonoUnico', async () => {
      mockPrismaService.proveedor.findFirst.mockResolvedValue({ id_proveedor: 1 });

      await expect((service as any).checkTelefonoUnico('3001234567')).rejects.toThrow(ConflictException);
    });

    it('no debe lanzar excepción si el teléfono es único', async () => {
      mockPrismaService.proveedor.findFirst.mockResolvedValue(null);

      await expect((service as any).checkTelefonoUnico('3001234567', 1)).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // MANEJO DE ERRORES PRISMA
  // =========================================================================
  describe('handlePrismaError', () => {
    it('debe lanzar ConflictException para error P2003 (productos asociados)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('FK error', {
        code: 'P2003',
        clientVersion: '6.0.0',
      });

      expect(() => (service as any).handlePrismaError(error, 'Fallback')).toThrow(ConflictException);
    });

    it('debe lanzar ConflictException para error P2002 (teléfono duplicado)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });

      expect(() => (service as any).handlePrismaError(error, 'Fallback')).toThrow(ConflictException);
    });

    it('debe lanzar InternalServerErrorException para cualquier otro error', () => {
      const error = new Error('Database disconnected');
      expect(() => (service as any).handlePrismaError(error, 'Fallback error')).toThrow(
        InternalServerErrorException,
      );
    });
  });

  // =========================================================================
  // FIND ALL & FIND ALL ADMIN
  // =========================================================================
  describe('findAll & findAllAdmin', () => {
    const mockDbProveedores = [
      {
        id_proveedor: 1,
        nombre: 'Alquería',
        apellido: 'S.A.',
        telefono: '3001112233',
        activo: true,
        _count: { productos: 5 },
      },
      {
        id_proveedor: 2,
        nombre: 'Bimbo',
        apellido: 'de Colombia',
        telefono: '3004445566',
        activo: false,
        _count: { productos: 0 },
      },
    ];

    it('debe listar solo proveedores activos por defecto en findAll', async () => {
      mockPrismaService.proveedor.findMany.mockResolvedValue([mockDbProveedores[0]]);

      const result = await service.findAll();

      expect(prismaService.proveedor.findMany).toHaveBeenCalledWith({
        where: { activo: true },
        select: expect.any(Object),
        orderBy: { nombre: 'asc' },
      });
      expect(result.success).toBe(true);
      expect(result.proveedores).toHaveLength(1);
      expect(result.proveedores[0]).toEqual({
        id: 1,
        nombre: 'Alquería',
        apellido: 'S.A.',
        telefono: '3001112233',
        activo: true,
        total_productos: 5,
      });
    });

    it('debe aplicar filtro de búsqueda si se envía search', async () => {
      mockPrismaService.proveedor.findMany.mockResolvedValue([mockDbProveedores[0]]);

      const result = await service.findAll('Alqueria', true);

      expect(prismaService.proveedor.findMany).toHaveBeenCalledWith({
        where: {
          activo: true,
          OR: [
            { nombre: { contains: 'Alqueria' } },
            { apellido: { contains: 'Alqueria' } },
            { telefono: { contains: 'Alqueria' } },
          ],
        },
        select: expect.any(Object),
        orderBy: { nombre: 'asc' },
      });
      expect(result.success).toBe(true);
    });

    it('debe listar todos los proveedores (activos e inactivos) en findAllAdmin', async () => {
      mockPrismaService.proveedor.findMany.mockResolvedValue(mockDbProveedores);

      const result = await service.findAllAdmin('Bimbo');

      expect(prismaService.proveedor.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { nombre: { contains: 'Bimbo' } },
            { apellido: { contains: 'Bimbo' } },
            { telefono: { contains: 'Bimbo' } },
          ],
        },
        select: expect.any(Object),
        orderBy: { nombre: 'asc' },
      });
      expect(result.success).toBe(true);
      expect(result.proveedores).toHaveLength(2);
    });
  });

  // =========================================================================
  // FIND ONE
  // =========================================================================
  describe('findOne', () => {
    it('debe retornar los datos del proveedor si existe', async () => {
      const mockProveedor = {
        id_proveedor: 1,
        nombre: 'Nestlé',
        apellido: 'Colombia',
        telefono: '3007778899',
        activo: true,
        _count: { productos: 12 },
      };
      mockPrismaService.proveedor.findUnique.mockResolvedValue(mockProveedor);

      const result = await service.findOne('1');

      expect(prismaService.proveedor.findUnique).toHaveBeenCalledWith({
        where: { id_proveedor: 1 },
        select: expect.any(Object),
      });
      expect(result.success).toBe(true);
      expect(result.proveedor).toEqual({
        id: 1,
        nombre: 'Nestlé',
        apellido: 'Colombia',
        telefono: '3007778899',
        activo: true,
        total_productos: 12,
      });
    });

    it('debe lanzar NotFoundException si el proveedor no existe', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // CREATE
  // =========================================================================
  describe('create', () => {
    const dto: CreateProveedorDto = {
      nombre: 'Distribuidora',
      apellido: 'El Triunfo',
      telefono: '3001234567',
    };

    it('debe crear un proveedor correctamente', async () => {
      mockPrismaService.proveedor.findFirst.mockResolvedValue(null);
      mockPrismaService.proveedor.create.mockResolvedValue({
        id_proveedor: 1,
        nombre: 'Distribuidora',
        apellido: 'El Triunfo',
        telefono: '3001234567',
        activo: true,
      });

      const result = await service.create(dto);

      expect(prismaService.proveedor.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Distribuidora',
          apellido: 'El Triunfo',
          telefono: '3001234567',
          activo: true,
        },
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Proveedor creado correctamente');
      expect(result.proveedor.id).toBe(1);
    });

    it('debe manejar error si prisma falla al crear', async () => {
      mockPrismaService.proveedor.findFirst.mockResolvedValue(null);
      mockPrismaService.proveedor.create.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // =========================================================================
  // UPDATE
  // =========================================================================
  describe('update', () => {
    it('debe lanzar NotFoundException si el proveedor no existe', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue(null);

      await expect(service.update('999', { nombre: 'Nuevo' })).rejects.toThrow(NotFoundException);
    });

    it('debe retornar éxito sin cambios si el DTO está vacío', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue({ id_proveedor: 1 });

      const result = await service.update('1', {});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Sin cambios para actualizar');
      expect(prismaService.proveedor.update).not.toHaveBeenCalled();
    });

    it('debe actualizar los datos del proveedor correctamente', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue({ id_proveedor: 1 });
      mockPrismaService.proveedor.findFirst.mockResolvedValue(null); // Teléfono único
      mockPrismaService.proveedor.update.mockResolvedValue({});

      const dto: UpdateProveedorDto = {
        nombre: 'Alquería Actualizada',
        apellido: 'S.A.S.',
        telefono: '3109876543',
      };

      const result = await service.update('1', dto);

      expect(prismaService.proveedor.update).toHaveBeenCalledWith({
        where: { id_proveedor: 1 },
        data: {
          nombre: 'Alquería Actualizada',
          apellido: 'S.A.S.',
          telefono: '3109876543',
        },
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Proveedor actualizado correctamente');
    });

    it('debe manejar error si prisma falla al actualizar', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue({ id_proveedor: 1 });
      mockPrismaService.proveedor.update.mockRejectedValue(new Error('Update DB error'));

      await expect(service.update('1', { nombre: 'Nombre' })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // =========================================================================
  // DESHABILITAR & HABILITAR
  // =========================================================================
  describe('deshabilitar & habilitar', () => {
    it('debe lanzar NotFoundException al deshabilitar si el proveedor no existe', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue(null);

      await expect(service.deshabilitar('999')).rejects.toThrow(NotFoundException);
    });

    it('debe informar si el proveedor ya estaba deshabilitado', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue({ id_proveedor: 1, activo: false });

      const result = await service.deshabilitar('1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('El proveedor ya estaba deshabilitado');
      expect(prismaService.proveedor.update).not.toHaveBeenCalled();
    });

    it('debe deshabilitar un proveedor activo exitosamente', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue({ id_proveedor: 1, activo: true });
      mockPrismaService.proveedor.update.mockResolvedValue({});

      const result = await service.deshabilitar('1');

      expect(prismaService.proveedor.update).toHaveBeenCalledWith({
        where: { id_proveedor: 1 },
        data: { activo: false },
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Proveedor deshabilitado correctamente');
    });

    it('debe lanzar NotFoundException al habilitar si el proveedor no existe', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue(null);

      await expect(service.habilitar('999')).rejects.toThrow(NotFoundException);
    });

    it('debe habilitar un proveedor exitosamente', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue({ id_proveedor: 1, activo: false });
      mockPrismaService.proveedor.update.mockResolvedValue({});

      const result = await service.habilitar('1');

      expect(prismaService.proveedor.update).toHaveBeenCalledWith({
        where: { id_proveedor: 1 },
        data: { activo: true },
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Proveedor habilitado correctamente');
    });
  });

  // =========================================================================
  // REMOVE (ELIMINACIÓN FÍSICA)
  // =========================================================================
  describe('remove', () => {
    it('debe lanzar NotFoundException al eliminar si el proveedor no existe', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el proveedor tiene productos asociados', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue({
        id_proveedor: 1,
        _count: { productos: 3 },
      });

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
      expect(prismaService.proveedor.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar físicamente un proveedor sin productos asociados', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue({
        id_proveedor: 1,
        _count: { productos: 0 },
      });
      mockPrismaService.proveedor.delete.mockResolvedValue({});

      const result = await service.remove('1');

      expect(prismaService.proveedor.delete).toHaveBeenCalledWith({
        where: { id_proveedor: 1 },
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Proveedor eliminado correctamente');
    });

    it('debe manejar error al eliminar si prisma falla', async () => {
      mockPrismaService.proveedor.findUnique.mockResolvedValue({
        id_proveedor: 1,
        _count: { productos: 0 },
      });
      mockPrismaService.proveedor.delete.mockRejectedValue(new Error('Delete DB error'));

      await expect(service.remove('1')).rejects.toThrow(InternalServerErrorException);
    });
  });
});
