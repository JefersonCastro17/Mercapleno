import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from '../../../src/sales/sales.controller';
import { SalesService } from '../../../src/sales/sales.service';
import { CreateOrderDto } from '../../../src/sales/dto/create-order.dto';
import { AuthUser } from '../../../src/auth/interfaces/auth-user.interface';

describe('SalesController', () => {
  let controller: SalesController;
  let service: jest.Mocked<SalesService>;

  const mockSalesService = {
    getFilteredProducts: jest.fn(),
    getAvailableCategories: jest.fn(),
    getPaymentMethods: jest.fn(),
    createOrder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        {
          provide: SalesService,
          useValue: mockSalesService,
        },
      ],
    }).compile();

    controller = module.get<SalesController>(SalesController);
    service = module.get(SalesService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('getProducts', () => {
    it('debe llamar a salesService.getFilteredProducts con los filtros proporcionados', async () => {
      const mockResult = [{ id_productos: 1, nombre: 'Producto A' }];
      mockSalesService.getFilteredProducts.mockResolvedValue(mockResult as any);

      const result = await controller.getProducts('arroz', '1', '1000', '5000');

      expect(service.getFilteredProducts).toHaveBeenCalledWith({
        search: 'arroz',
        category: '1',
        precioMin: '1000',
        precioMax: '5000',
      });
      expect(result).toEqual(mockResult);
    });

    it('debe manejar filtros opcionales indefinidos', async () => {
      mockSalesService.getFilteredProducts.mockResolvedValue([]);

      const result = await controller.getProducts();

      expect(service.getFilteredProducts).toHaveBeenCalledWith({
        search: undefined,
        category: undefined,
        precioMin: undefined,
        precioMax: undefined,
      });
      expect(result).toEqual([]);
    });
  });

  describe('getCategories', () => {
    it('debe llamar a salesService.getAvailableCategories', async () => {
      const mockCategories = [{ id_categoria: 1, nombre: 'Granos' }];
      mockSalesService.getAvailableCategories.mockResolvedValue(mockCategories as any);

      const result = await controller.getCategories();

      expect(service.getAvailableCategories).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getPaymentMethods', () => {
    it('debe llamar a salesService.getPaymentMethods', async () => {
      const mockMethods = [{ id_metodo_pago: 1, nombre_metodo: 'Efectivo' }];
      mockSalesService.getPaymentMethods.mockResolvedValue(mockMethods as any);

      const result = await controller.getPaymentMethods();

      expect(service.getPaymentMethods).toHaveBeenCalled();
      expect(result).toEqual(mockMethods);
    });
  });

  describe('createOrder', () => {
    const dto: CreateOrderDto = {
      id_metodo: 'M1',
      total: 5000,
      items: [{ id: '1', cantidad: 2 }],
    };

    it('debe llamar a salesService.createOrder con el DTO y el ID de usuario autenticado', async () => {
      const user: AuthUser = { id: 42, id_rol: 1, email: 'admin@mercapleno.com' };
      const mockOrderResponse = { orderId: 10, total: 5000, message: 'Orden creada' };
      mockSalesService.createOrder.mockResolvedValue(mockOrderResponse as any);

      const result = await controller.createOrder(dto, user);

      expect(service.createOrder).toHaveBeenCalledWith(dto, 42);
      expect(result).toEqual(mockOrderResponse);
    });

    it('debe llamar a salesService.createOrder con undefined cuando no hay usuario autenticado', async () => {
      const mockOrderResponse = { orderId: 11, total: 2000, message: 'Orden creada' };
      mockSalesService.createOrder.mockResolvedValue(mockOrderResponse as any);

      const result = await controller.createOrder(dto, undefined);

      expect(service.createOrder).toHaveBeenCalledWith(dto, undefined);
      expect(result).toEqual(mockOrderResponse);
    });
  });
});
