import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '../../../src/products/products.controller';
import { ProductsService } from '../../../src/products/products.service';
import { CreateProductDto } from '../../../src/products/dto/create-product.dto';
import { UpdateProductDto } from '../../../src/products/dto/update-product.dto';
import { ProductStatus } from '../../../src/products/dto/product-status.enum';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  const mockProductsService = {
    getCatalogs: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
    expect(ProductStatus.Disponible).toBe('Disponible');
    expect(ProductStatus.Agotado).toBe('Agotado');
    expect(ProductStatus.Deshabilitado).toBe('Deshabilitado');
  });

  describe('getCatalogs', () => {
    it('debe llamar a productsService.getCatalogs', async () => {
      const mockCatalogs = {
        categorias: [{ id_categoria: 1, nombre: 'Abarrotes' }],
        proveedores: [{ id_proveedor: 1, nombre: 'Proveedor X' }],
      };
      mockProductsService.getCatalogs.mockResolvedValue(mockCatalogs as any);

      const result = await controller.getCatalogs();

      expect(service.getCatalogs).toHaveBeenCalled();
      expect(result).toEqual(mockCatalogs);
    });
  });

  describe('findAll', () => {
    it('debe llamar a productsService.findAll', async () => {
      const mockList = [{ id_productos: 1, nombre: 'Arroz' }];
      mockProductsService.findAll.mockResolvedValue(mockList as any);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockList);
    });
  });

  describe('create', () => {
    const dto: CreateProductDto = {
      nombre: 'Aceite Vegetal',
      precio: 8500,
      id_categoria: 1,
      id_proveedor: 2,
      estado: 'Disponible',
      descripcion: 'Aceite de cocina',
    };

    it('debe llamar a productsService.create con dto y ruta de imagen cuando se provee archivo', async () => {
      const file = { filename: 'aceite-123.jpg' };
      const createdProduct = { id_productos: 10, ...dto, imagen: '/uploads/productos/aceite-123.jpg' };
      mockProductsService.create.mockResolvedValue(createdProduct as any);

      const result = await controller.create(dto, file);

      expect(service.create).toHaveBeenCalledWith(dto, '/uploads/productos/aceite-123.jpg');
      expect(result).toEqual(createdProduct);
    });

    it('debe llamar a productsService.create sin imagen cuando no se provee archivo', async () => {
      const createdProduct = { id_productos: 11, ...dto, imagen: undefined };
      mockProductsService.create.mockResolvedValue(createdProduct as any);

      const result = await controller.create(dto, undefined);

      expect(service.create).toHaveBeenCalledWith(dto, undefined);
      expect(result).toEqual(createdProduct);
    });
  });

  describe('update', () => {
    const dto: UpdateProductDto = {
      nombre: 'Aceite Vegetal Modificado',
      precio: 9000,
    };

    it('debe llamar a productsService.update con id, dto y ruta de imagen cuando hay archivo', async () => {
      const file = { filename: 'aceite-mod.jpg' };
      const updatedProduct = { id_productos: 5, ...dto, imagen: '/uploads/productos/aceite-mod.jpg' };
      mockProductsService.update.mockResolvedValue(updatedProduct as any);

      const result = await controller.update(5, dto, file);

      expect(service.update).toHaveBeenCalledWith(5, dto, '/uploads/productos/aceite-mod.jpg');
      expect(result).toEqual(updatedProduct);
    });

    it('debe llamar a productsService.update sin imagen cuando no hay archivo', async () => {
      const updatedProduct = { id_productos: 5, ...dto };
      mockProductsService.update.mockResolvedValue(updatedProduct as any);

      const result = await controller.update(5, dto, undefined);

      expect(service.update).toHaveBeenCalledWith(5, dto, undefined);
      expect(result).toEqual(updatedProduct);
    });
  });

  describe('remove', () => {
    it('debe llamar a productsService.remove con el id', async () => {
      const mockResult = { message: 'Producto eliminado correctamente' };
      mockProductsService.remove.mockResolvedValue(mockResult as any);

      const result = await controller.remove(5);

      expect(service.remove).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockResult);
    });
  });
});
