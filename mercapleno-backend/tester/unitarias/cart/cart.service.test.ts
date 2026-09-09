import { BadRequestException, ConflictException } from '@nestjs/common';
import { CartService } from '../../../src/cart/cart.service';
import { CartController } from '../../../src/cart/cart.controller';
import { MysqlService } from '../../../src/common/database/mysql.service';

describe('CartService y CartController (Unitarias)', () => {
  let service: CartService;
  let controller: CartController;
  let mockDb: { query: jest.Mock };

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    };

    service = new CartService(mockDb as unknown as MysqlService);
    controller = new CartController(service);
  });

  // =========================================================================
  // ensureActiveCart
  // =========================================================================
  describe('ensureActiveCart', () => {
    it('debe retornar el id del carrito activo existente', async () => {
      mockDb.query.mockResolvedValueOnce([[{ id: 10 }]]);

      const cartId = await service.ensureActiveCart(1);
      expect(cartId).toBe(10);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id FROM cart WHERE id_usuario = ? AND status = ? LIMIT 1',
        [1, 'active'],
      );
    });

    it('debe crear un nuevo carrito activo si no existe', async () => {
      mockDb.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 25 }]);

      const cartId = await service.ensureActiveCart(1);
      expect(cartId).toBe(25);
    });
  });

  // =========================================================================
  // getCart
  // =========================================================================
  describe('getCart', () => {
    it('debe lanzar BadRequestException si no hay userId', async () => {
      await expect(service.getCart(0)).rejects.toThrow(BadRequestException);
    });

    it('debe retornar items del carrito mapeados correctamente', async () => {
      mockDb.query
        .mockResolvedValueOnce([[{ id: 10 }]]) // ensureActiveCart
        .mockResolvedValueOnce([
          [
            {
              id: 1,
              id_productos: 100,
              cantidad: 2,
              price_snapshot: 5000,
              nombre: 'Arroz',
              stock: '20',
            },
          ],
        ]);

      const result = await service.getCart(1);

      expect(result).toEqual([
        {
          id: 1,
          productId: 100,
          name: 'Arroz',
          quantity: 2,
          price: 5000,
          stock: 20,
        },
      ]);
    });
  });

  // =========================================================================
  // getCartSum
  // =========================================================================
  describe('getCartSum', () => {
    it('debe lanzar BadRequestException si no hay userId', async () => {
      await expect(service.getCartSum(0)).rejects.toThrow(BadRequestException);
    });

    it('debe calcular subtotal, impuestos, total y advertencias de stock', async () => {
      mockDb.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            productId: 100,
            cantidad: 3,
            price_snapshot: 1000,
            nombre: 'Leche',
            currentPrice: 1200,
            availableStock: 2, // Menor que la cantidad -> genera warning
          },
        ],
      ]);

      const result = await service.getCartSum(1);

      expect(result.subtotal).toBe(3000);
      expect(result.tax).toBe(570);
      expect(result.total).toBe(3570);
      expect(result.itemCount).toBe(3);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toEqual({ productId: 100, available: 2 });
    });
  });

  // =========================================================================
  // addItem
  // =========================================================================
  describe('addItem', () => {
    it('debe incrementar cantidad si el producto ya existe en el carrito', async () => {
      mockDb.query
        .mockResolvedValueOnce([[{ id: 10 }]]) // ensureActiveCart
        .mockResolvedValueOnce([[{ precio: 2500, estado: 'Disponible' }]]) // product found
        .mockResolvedValueOnce([[{ stock: 10 }]]) // stock
        .mockResolvedValueOnce([[{ id: 5, cantidad: 2 }]]) // existing
        .mockResolvedValueOnce([{}]); // update

      const result = await service.addItem(1, { productId: 100, quantity: 3 });

      expect(result).toEqual({ id: 5, productId: 100, quantity: 5 });
    });

    it('debe lanzar ConflictException si el producto a agregar no existe', async () => {
      mockDb.query
        .mockResolvedValueOnce([[{ id: 10 }]]) // ensureActiveCart
        .mockResolvedValueOnce([[]]); // no product in catalog

      await expect(service.addItem(1, { productId: 999, quantity: 1 })).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe insertar nuevo item si no existía en el carrito', async () => {
      mockDb.query
        .mockResolvedValueOnce([[{ id: 10 }]]) // ensureActiveCart
        .mockResolvedValueOnce([[{ precio: 2500, estado: 'Disponible' }]]) // product found
        .mockResolvedValueOnce([[{ stock: 10 }]]) // stock
        .mockResolvedValueOnce([[]]) // no existing
        .mockResolvedValueOnce([{ insertId: 77 }]); // insert

      const result = await service.addItem(1, { productId: 100, quantity: 1 });

      expect(result).toEqual({ id: 77, productId: 100, quantity: 1 });
    });
  });

  // =========================================================================
  // updateItem
  // =========================================================================
  describe('updateItem', () => {
    it('debe lanzar BadRequestException si la cantidad enviada es menor o igual a 0', async () => {
      await expect(service.updateItem(1, 5, { quantity: 0 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar Error si el item no existe en el carrito activo', async () => {
      mockDb.query.mockResolvedValueOnce([[]]); // item not found

      await expect(service.updateItem(1, 999, { quantity: 2 })).rejects.toThrow(
        'Item no encontrado en el carrito activo',
      );
    });

    it('debe actualizar la cantidad si el item existe', async () => {
      mockDb.query
        .mockResolvedValueOnce([[{ id: 5, id_productos: 100, cantidad: 1 }]])
        .mockResolvedValueOnce([[{ stock: 10 }]])
        .mockResolvedValueOnce([{}]); // update query

      const result = await service.updateItem(1, 5, { quantity: 4 });

      expect(result).toEqual({ id: 5, productId: 100, quantity: 4 });
    });
  });

  // =========================================================================
  // deleteItem & clearCart
  // =========================================================================
  describe('deleteItem y clearCart', () => {
    it('debe eliminar un item del carrito', async () => {
      mockDb.query.mockResolvedValueOnce([{}]);

      const result = await service.deleteItem(1, 5);
      expect(result).toEqual({ success: true });
    });

    it('debe vaciar el carrito activo completo', async () => {
      mockDb.query
        .mockResolvedValueOnce([[{ id: 10 }]]) // ensureActiveCart
        .mockResolvedValueOnce([{}]); // delete from cart_items

      const result = await service.clearCart(1);
      expect(result).toEqual({ success: true });
    });
  });

  // =========================================================================
  // CartController
  // =========================================================================
  describe('CartController', () => {
    const mockUser: any = { id: 1, email: 'user@test.com', id_rol: 3 };

    it('debe llamar a getCart del servicio', async () => {
      jest.spyOn(service, 'getCart').mockResolvedValue([] as any);
      await controller.getCart(mockUser);
      expect(service.getCart).toHaveBeenCalledWith(1);
    });

    it('debe llamar a getCartSum del servicio', async () => {
      jest.spyOn(service, 'getCartSum').mockResolvedValue({} as any);
      await controller.getSum(mockUser);
      expect(service.getCartSum).toHaveBeenCalledWith(1);
    });

    it('debe llamar a addItem del servicio', async () => {
      jest.spyOn(service, 'addItem').mockResolvedValue({} as any);
      await controller.addItem(mockUser, { productId: 10, quantity: 2 });
      expect(service.addItem).toHaveBeenCalledWith(1, { productId: 10, quantity: 2 });
    });

    it('debe llamar a updateItem del servicio', async () => {
      jest.spyOn(service, 'updateItem').mockResolvedValue({} as any);
      await controller.updateItem(mockUser, 5, { quantity: 3 });
      expect(service.updateItem).toHaveBeenCalledWith(1, 5, { quantity: 3 });
    });

    it('debe llamar a deleteItem del servicio', async () => {
      jest.spyOn(service, 'deleteItem').mockResolvedValue({} as any);
      await controller.deleteItem(mockUser, 5);
      expect(service.deleteItem).toHaveBeenCalledWith(1, 5);
    });

    it('debe llamar a clearCart del servicio', async () => {
      jest.spyOn(service, 'clearCart').mockResolvedValue({} as any);
      await controller.clearCart(mockUser);
      expect(service.clearCart).toHaveBeenCalledWith(1);
    });
  });
});
