process.env.INTERNAL_API_KEY = 'test-internal-key';

import { BadRequestException, ConflictException } from '@nestjs/common';
import { CartService } from '../../../src/cart/cart.service';

describe('CartService (Unitarias)', () => {
  let service: CartService;
  let db: { query: jest.Mock };

  beforeEach(() => {
    db = { query: jest.fn() };
    service = new CartService(db as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CP-081 a CP-085 - Agregar productos', () => {
    it('CP-081 - agrega un producto al carrito persistido', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 10 }]])
        .mockResolvedValueOnce([[{ precio: 3500, estado: 'Disponible' }]])
        .mockResolvedValueOnce([[{ stock: 5 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 44 }]);

      const result = await service.addItem(5, { productId: 1, quantity: 2 });

      expect(result).toEqual({ id: 44, productId: 1, quantity: 2 });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO cart_items'),
        [10, 1, 2, 3500],
      );
    });

    it('CP-082 - rechaza una cantidad superior al stock', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 10 }]])
        .mockResolvedValueOnce([[{ precio: 3500, estado: 'Disponible' }]])
        .mockResolvedValueOnce([[{ stock: 5 }]]);

      await expect(service.addItem(5, { productId: 1, quantity: 99 })).rejects.toThrow(ConflictException);
      expect(db.query).toHaveBeenCalledTimes(3);
    });

    it('CP-083 - rechaza un producto deshabilitado', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 10 }]])
        .mockResolvedValueOnce([[{ precio: 5000, estado: 'Deshabilitado' }]]);

      await expect(service.addItem(5, { productId: 3, quantity: 1 })).rejects.toThrow(ConflictException);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('CP-084 - incrementa el item existente sin duplicarlo', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 10 }]])
        .mockResolvedValueOnce([[{ precio: 3500, estado: 'Disponible' }]])
        .mockResolvedValueOnce([[{ stock: 5 }]])
        .mockResolvedValueOnce([[{ id: 44, cantidad: 1 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await service.addItem(5, { productId: 1, quantity: 2 });

      expect(result).toEqual({ id: 44, productId: 1, quantity: 3 });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cart_items SET cantidad'),
        [3, 44],
      );
      expect(db.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO cart_items'), expect.anything());
    });

    it('CP-085 - rechaza datos invalidos del carrito', async () => {
      db.query.mockResolvedValueOnce([[{ id: 10 }]]);

      await expect(service.addItem(5, { productId: Number.NaN, quantity: -1 })).rejects.toThrow(BadRequestException);
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('CP-086 a CP-088 - Consulta y calculo del carrito', () => {
    it('CP-086 - calcula subtotal, impuesto y total desde los snapshots', async () => {
      db.query.mockResolvedValueOnce([[
        { id: 44, productId: 1, cantidad: 2, price_snapshot: 3500, nombre: 'Arroz', currentPrice: 3500, availableStock: 5 },
        { id: 45, productId: 2, cantidad: 1, price_snapshot: 4200, nombre: 'Leche', currentPrice: 4500, availableStock: 3 },
      ]]);

      const result = await service.getCartSum(5);

      expect(result).toMatchObject({ subtotal: 11200, tax: 2128, total: 13328, itemCount: 3 });
      expect(result.items).toEqual([
        expect.objectContaining({ productId: 1, subtotal: 7000, priceChanged: false }),
        expect.objectContaining({ productId: 2, subtotal: 4200, priceChanged: true }),
      ]);
      expect(result.warnings).toEqual([]);
    });

    it('CP-087 - un carrito nuevo devuelve una lista vacia', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 10 }]])
        .mockResolvedValueOnce([[]]);

      await expect(service.getCart(5)).resolves.toEqual([]);
    });

    it('CP-088 - el calculo exacto coincide con los valores esperados', async () => {
      db.query.mockResolvedValueOnce([[
        { id: 44, productId: 1, cantidad: 1, price_snapshot: 3500, nombre: 'Arroz', currentPrice: 3500, availableStock: 5 },
      ]]);

      const result = await service.getCartSum(5);

      expect(result.subtotal).toBe(3500);
      expect(result.tax).toBe(665);
      expect(result.total).toBe(4165);
    });

    it('devuelve el carrito con stock disponible por item', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 10 }]])
        .mockResolvedValueOnce([[{ id: 44, id_productos: 1, cantidad: 2, price_snapshot: 3500, nombre: 'Arroz', stock: 4 }]]);

      await expect(service.getCart(5)).resolves.toEqual([{
        id: 44,
        productId: 1,
        name: 'Arroz',
        quantity: 2,
        price: 3500,
        stock: 4,
      }]);
    });
  });

  describe('CP-091 a CP-094 - Actualizar y eliminar', () => {
    it('CP-091 - elimina un item del carrito del usuario', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await expect(service.deleteItem(5, 44)).resolves.toEqual({ success: true });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE ci FROM cart_items'),
        [44, 5, 'active'],
      );
    });

    it('CP-092 - rechaza actualizar una cantidad superior al stock', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 44, id_productos: 1, cantidad: 1 }]])
        .mockResolvedValueOnce([[{ stock: 2 }]]);

      await expect(service.updateItem(5, 44, { quantity: 99 })).rejects.toThrow(ConflictException);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('CP-093 - actualiza una cantidad valida sin duplicar el item', async () => {
      db.query
        .mockResolvedValueOnce([[{ id: 44, id_productos: 1, cantidad: 1 }]])
        .mockResolvedValueOnce([[{ stock: 5 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await service.updateItem(5, 44, { quantity: 3 });

      expect(result).toEqual({ id: 44, productId: 1, quantity: 3 });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cart_items SET cantidad'),
        [3, 44],
      );
    });

    it('CP-094 - rechaza actualizar con cantidad invalida', async () => {
      await expect(service.updateItem(5, 44, { quantity: 0 })).rejects.toThrow(BadRequestException);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('rechaza actualizar un item que no pertenece al carrito activo del usuario', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await expect(service.updateItem(5, 44, { quantity: 2 })).rejects.toThrow('Item no encontrado');
    });
  });

  describe('Validaciones de usuario', () => {
    it('rechaza consultar el carrito sin usuario autenticado', async () => {
      await expect(service.getCart(0)).rejects.toThrow(BadRequestException);
      await expect(service.getCartSum(0)).rejects.toThrow(BadRequestException);
      expect(db.query).not.toHaveBeenCalled();
    });
  });
});
