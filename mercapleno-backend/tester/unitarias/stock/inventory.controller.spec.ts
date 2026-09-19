import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from '../../../src/inventory/inventory.controller';
import { InventoryService } from '../../../src/inventory/inventory.service';
import { RegisterMovementDto } from '../../../src/inventory/dto/register-movement.dto';
import { GetReferenceDocumentsDto } from '../../../src/inventory/dto/get-reference-documents.dto';
import { AuthUser } from '../../../src/auth/interfaces/auth-user.interface';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: jest.Mocked<InventoryService>;

  const mockInventoryService = {
    getProductsWithStock: jest.fn(),
    getReferenceDocuments: jest.fn(),
    registerMovement: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    service = module.get(InventoryService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('getProductsWithStock', () => {
    it('debe llamar a inventoryService.getProductsWithStock', async () => {
      const mockProducts = [{ id_productos: 1, nombre: 'Arroz', stock_actual: 20 }];
      mockInventoryService.getProductsWithStock.mockResolvedValue(mockProducts as any);

      const result = await controller.getProductsWithStock();

      expect(service.getProductsWithStock).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getReferenceDocuments', () => {
    it('debe llamar a inventoryService.getReferenceDocuments con el tipo de movimiento', async () => {
      const query: GetReferenceDocumentsDto = { tipo_movimiento: 'ENTRADA' };
      const mockDocs = [{ id_documento: 'DOC-001', tipo: 'Compra' }];
      mockInventoryService.getReferenceDocuments.mockResolvedValue(mockDocs as any);

      const result = await controller.getReferenceDocuments(query);

      expect(service.getReferenceDocuments).toHaveBeenCalledWith('ENTRADA');
      expect(result).toEqual(mockDocs);
    });
  });

  describe('registerMovement', () => {
    const dto: RegisterMovementDto = {
      id_producto: 1,
      tipo_movimiento: 'ENTRADA',
      cantidad: 5,
      id_documento: 'DOC1',
    };

    it('debe llamar a inventoryService.registerMovement con el DTO y el id de usuario', async () => {
      const user: AuthUser = { id: 7, id_rol: 1, email: 'admin@mercapleno.com' };
      const mockResult = { id_movimiento: 100, message: 'Movimiento registrado con éxito' };
      mockInventoryService.registerMovement.mockResolvedValue(mockResult as any);

      const result = await controller.registerMovement(dto, user);

      expect(service.registerMovement).toHaveBeenCalledWith(dto, 7);
      expect(result).toEqual(mockResult);
    });

    it('debe llamar a inventoryService.registerMovement con undefined cuando no hay usuario', async () => {
      const mockResult = { id_movimiento: 101, message: 'Movimiento registrado con éxito' };
      mockInventoryService.registerMovement.mockResolvedValue(mockResult as any);

      const result = await controller.registerMovement(dto, undefined);

      expect(service.registerMovement).toHaveBeenCalledWith(dto, undefined);
      expect(result).toEqual(mockResult);
    });
  });
});
