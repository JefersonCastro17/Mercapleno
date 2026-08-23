import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      productos: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      venta_productos: {
        deleteMany: jest.fn(),
      },
      stock_actual: {
        deleteMany: jest.fn(),
      },
      salida_productos: {
        deleteMany: jest.fn(),
      },
      entrada_productos: {
        deleteMany: jest.fn(),
      },
      devolver_productos: {
        deleteMany: jest.fn(),
      },
    };

    service = new ProductsService(prisma);
  });

  it('debe eliminar primero las relaciones relacionadas antes de borrar el producto', async () => {
    const tx = {
      productos: {
        delete: jest.fn().mockResolvedValue({}),
      },
      venta_productos: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      stock_actual: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      salida_productos: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      entrada_productos: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      devolver_productos: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    prisma.productos.findUnique.mockResolvedValue({ id_productos: 10, imagen: null });
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => Promise<void>) => callback(tx));

    const result = await service.remove(10);

    expect(result).toEqual({ message: 'Producto eliminado correctamente' });
    expect(tx.venta_productos.deleteMany).toHaveBeenCalledWith({ where: { id_productos: 10 } });
    expect(tx.stock_actual.deleteMany).toHaveBeenCalledWith({ where: { id_productos: 10 } });
    expect(tx.salida_productos.deleteMany).toHaveBeenCalledWith({ where: { id_productos: 10 } });
    expect(tx.entrada_productos.deleteMany).toHaveBeenCalledWith({ where: { id_productos: 10 } });
    expect(tx.devolver_productos.deleteMany).toHaveBeenCalledWith({ where: { id_productos: 10 } });
    expect(tx.productos.delete).toHaveBeenCalledWith({ where: { id_productos: 10 } });
  });
});
