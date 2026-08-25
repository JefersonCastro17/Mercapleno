import { Test, TestingModule } from '@nestjs/testing';
import { ProveedoresController } from '../../../src/proveedores/proveedores.controller';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { CreateProveedorDto } from '../../../src/proveedores/dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../../../src/proveedores/dto/update-proveedor.dto';

describe('ProveedoresController (Unitarias)', () => {
  let controller: ProveedoresController;
  let service: ProveedoresService;

  const mockProveedoresService = {
    findAll: jest.fn(),
    findAllAdmin: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deshabilitar: jest.fn(),
    habilitar: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProveedoresController],
      providers: [
        {
          provide: ProveedoresService,
          useValue: mockProveedoresService,
        },
      ],
    }).compile();

    controller = module.get<ProveedoresController>(ProveedoresController);
    service = module.get<ProveedoresService>(ProveedoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe llamar a service.findAll con search y soloActivos=true', async () => {
      const mockResult = { success: true, proveedores: [] };
      mockProveedoresService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll('lacteos');

      expect(service.findAll).toHaveBeenCalledWith('lacteos', true);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAllAdmin', () => {
    it('debe llamar a service.findAllAdmin con search', async () => {
      const mockResult = { success: true, proveedores: [] };
      mockProveedoresService.findAllAdmin.mockResolvedValue(mockResult);

      const result = await controller.findAllAdmin('lacteos');

      expect(service.findAllAdmin).toHaveBeenCalledWith('lacteos');
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('debe llamar a service.findOne con el ID', async () => {
      const mockResult = { success: true, proveedor: { id: 1, nombre: 'Test' } };
      mockProveedoresService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO', async () => {
      const dto: CreateProveedorDto = {
        nombre: 'Nuevo',
        apellido: 'Proveedor',
        telefono: '3001234567',
      };
      const mockResult = { success: true, message: 'Proveedor creado correctamente' };
      mockProveedoresService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('debe llamar a service.update con el ID y el DTO', async () => {
      const dto: UpdateProveedorDto = { nombre: 'Actualizado' };
      const mockResult = { success: true, message: 'Proveedor actualizado correctamente' };
      mockProveedoresService.update.mockResolvedValue(mockResult);

      const result = await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('deshabilitar', () => {
    it('debe llamar a service.deshabilitar con el ID', async () => {
      const mockResult = { success: true, message: 'Proveedor deshabilitado correctamente' };
      mockProveedoresService.deshabilitar.mockResolvedValue(mockResult);

      const result = await controller.deshabilitar('1');

      expect(service.deshabilitar).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('habilitar', () => {
    it('debe llamar a service.habilitar con el ID', async () => {
      const mockResult = { success: true, message: 'Proveedor habilitado correctamente' };
      mockProveedoresService.habilitar.mockResolvedValue(mockResult);

      const result = await controller.habilitar('1');

      expect(service.habilitar).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('debe llamar a service.remove con el ID', async () => {
      const mockResult = { success: true, message: 'Proveedor eliminado correctamente' };
      mockProveedoresService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });
});
