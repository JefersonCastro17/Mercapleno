import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<Pick<ProductsService, 'findAll' | 'getCatalogs' | 'create' | 'update' | 'remove'>>;

  beforeEach(() => {
    // 1. Mockeamos los métodos de ProductsService que el controlador utiliza
    productsService = {
      findAll: jest.fn(),
      getCatalogs: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    // 2. Instanciamos el controlador pasándole la simulación del servicio
    controller = new ProductsController(productsService as unknown as ProductsService);
  });

  describe('findAll', () => {
    it('debe retornar todos los productos del servicio', async () => {
      const mockProducts = [
        { id_productos: 1, nombre: 'Producto A', precio: 1500, estado: 'Disponible' },
        { id_productos: 2, nombre: 'Producto B', precio: 3000, estado: 'Agotado' },
      ];
      productsService.findAll.mockResolvedValue(mockProducts as any);

      const result = await controller.findAll();

      expect(result).toBe(mockProducts);
      expect(productsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('debe eliminar el producto llamando al servicio con el ID correspondiente', async () => {
      const mockResponse = { success: true, message: 'Producto eliminado correctamente' };
      productsService.remove.mockResolvedValue(mockResponse as any);

      const result = await controller.remove(10);

      expect(result).toBe(mockResponse);
      expect(productsService.remove).toHaveBeenCalledWith(10);
    });
  });
});
