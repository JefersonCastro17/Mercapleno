import { Test, TestingModule } from '@nestjs/testing';
import { UsersAdminController } from '../../../src/users-admin/users-admin.controller';
import { UsersAdminService } from '../../../src/users-admin/users-admin.service';
import { CreateUserAdminDto } from '../../../src/users-admin/dto/create-user-admin.dto';
import { UpdateUserAdminDto } from '../../../src/users-admin/dto/update-user-admin.dto';

describe('UsersAdminController (Unitarias)', () => {
  let controller: UsersAdminController;
  let service: UsersAdminService;

  const mockUsersAdminService = {
    findAll: jest.fn(),
    findRoles: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersAdminController],
      providers: [
        {
          provide: UsersAdminService,
          useValue: mockUsersAdminService,
        },
      ],
    }).compile();

    controller = module.get<UsersAdminController>(UsersAdminController);
    service = module.get<UsersAdminService>(UsersAdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe listar los usuarios administrativos delegando al servicio', async () => {
      const mockUsers = [{ id: 1, nombre: 'Admin' }];
      mockUsersAdminService.findAll.mockResolvedValue({ success: true, usuarios: mockUsers });

      const result = await controller.findAll('search_term');

      expect(service.findAll).toHaveBeenCalledWith('search_term');
      expect(result).toEqual({ success: true, usuarios: mockUsers });
    });
  });

  describe('findRoles', () => {
    it('debe listar los roles disponibles delegando al servicio', async () => {
      const mockRoles = [{ id: 1, nombre: 'SuperAdmin' }, { id: 2, nombre: 'Admin' }];
      mockUsersAdminService.findRoles.mockResolvedValue({ success: true, roles: mockRoles });

      const result = await controller.findRoles();

      expect(service.findRoles).toHaveBeenCalled();
      expect(result).toEqual({ success: true, roles: mockRoles });
    });
  });

  describe('findOne', () => {
    it('debe consultar un usuario por ID delegando al servicio', async () => {
      const mockUser = { id: 1, nombre: 'Admin' };
      mockUsersAdminService.findOne.mockResolvedValue({ success: true, usuario: mockUser });

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual({ success: true, usuario: mockUser });
    });
  });

  describe('create', () => {
    it('debe crear un usuario administrativo delegando al servicio', async () => {
      const dto: CreateUserAdminDto = {
        nombre: 'Nuevo',
        apellido: 'Admin',
        email: 'nuevo@admin.com',
        password: 'Password123!',
        direccion: 'Calle 456',
        fecha_nacimiento: '1990-01-01',
        id_rol: 2,
        id_tipo_identificacion: 1,
        numero_identificacion: '987654321',
      };
      const mockResponse = { success: true, message: 'Usuario agregado correctamente' };
      mockUsersAdminService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update & updatePut', () => {
    it('debe actualizar un usuario vía PATCH delegando al servicio', async () => {
      const dto: UpdateUserAdminDto = { nombre: 'Actualizado' };
      const mockResponse = { success: true, message: 'Usuario actualizado correctamente' };
      mockUsersAdminService.update.mockResolvedValue(mockResponse);

      const result = await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(mockResponse);
    });

    it('debe actualizar un usuario vía PUT delegando al servicio', async () => {
      const dto: UpdateUserAdminDto = { nombre: 'Actualizado Put' };
      const mockResponse = { success: true, message: 'Usuario actualizado correctamente' };
      mockUsersAdminService.update.mockResolvedValue(mockResponse);

      const result = await controller.updatePut('1', dto);

      expect(service.update).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    it('debe eliminar un usuario delegando al servicio', async () => {
      const mockResponse = { success: true, message: 'Usuario eliminado correctamente' };
      mockUsersAdminService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResponse);
    });
  });
});
