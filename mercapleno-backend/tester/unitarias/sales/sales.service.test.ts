process.env.INTERNAL_API_KEY = 'test-internal-key';

import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { SalesService } from '../../../src/sales/sales.service';

describe('SalesService (Unitarias)', () => {
  let service: SalesService;
  let db: { query: jest.Mock; getConnection: jest.Mock };
  let emailService: { sendLowStockAlertToAdmins: jest.Mock };

  beforeEach(() => {
    db = {
      query: jest.fn(),
      getConnection: jest.fn(),
    };

    emailService = {
      sendLowStockAlertToAdmins: jest.fn(),
    };

    service = new SalesService(db as any, emailService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RF-003.1 - Catálogo de productos', () => {
    it('CP-071 - debe devolver el catálogo filtrado con productos activos y stock disponible', async () => {
      db.query.mockResolvedValue([
        [
          {
            id: 1,
            nombre: 'Arroz Premium',
            descripcion: 'Arroz de primera calidad',
            precio: '2500',
            category: 'Abarrotes',
            image: 'arroz.png',
            stock: 10,
          },
          {
            id: 2,
            nombre: 'Leche Entera',
            descripcion: 'Leche 1L',
            precio: '3200',
            category: 'Lácteos',
            image: 'leche.png',
            stock: 15,
          },
        ],
      ]);

      const result = await service.getFilteredProducts({});

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: '1',
        nombre: 'Arroz Premium',
        price: 2500,
        category: 'abarrotes',
        stock: 10,
      });
      expect(db.query).toHaveBeenCalled();
    });

    it('CP-075 - debe aplicar filtros por nombre, categoría y rango de precios', async () => {
      db.query.mockResolvedValue([[{ id: 3, nombre: 'Pan integral', descripcion: 'Pan saludable', precio: '3500', category: 'Panadería', image: 'pan.png', stock: 8 }]]);

      const result = await service.getFilteredProducts({
        search: 'pan',
        category: 'Panadería',
        precioMin: '3000',
        precioMax: '4000',
      });

      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Pan integral');
      expect(result[0].category).toBe('panadería');
      expect(result[0].price).toBe(3500);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(c.nombre) = LOWER(?)'),
        expect.arrayContaining(['Panadería']),
      );
    });
  });

  describe('RF-003.2 - Categorías disponibles', () => {
    it('debe devolver categorías con stock disponible', async () => {
      db.query.mockResolvedValue([
        [
          { category: 'Abarrotes', product_count: 5 },
          { category: 'Bebidas', product_count: 2 },
        ],
      ]);

      const result = await service.getAvailableCategories();

      expect(result).toEqual([
        { value: 'abarrotes', label: 'Abarrotes', count: 5 },
        { value: 'bebidas', label: 'Bebidas', count: 2 },
      ]);
    });
  });

  describe('RF-003.6 - Confirmación de venta', () => {
    it('CP-095 - debe registrar una venta válida con método de pago soportado', async () => {
      const connection = {
        beginTransaction: jest.fn(),
        query: jest.fn((sql: string) => {
          if (sql.includes('SELECT id_metodo')) {
            return Promise.resolve([[{ id_metodo: 'M1' }]]);
          }

          if (sql.includes('INSERT INTO venta')) {
            return Promise.resolve([{ insertId: 99 }]);
          }

          if (sql.includes('SELECT p.nombre, p.precio, sa.stock')) {
            return Promise.resolve([[{ nombre: 'Arroz', precio: 3500, stock: 5 }]]);
          }

          if (sql.includes('INSERT INTO movimiento')) {
            return Promise.resolve([{ insertId: 77 }]);
          }

          if (sql.includes('UPDATE stock_actual')) {
            return Promise.resolve([{ affectedRows: 1 }]);
          }

          return Promise.resolve([[]]);
        }),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(connection);

      const result = await service.createOrder({ items: [{ id: '1', cantidad: 1 }], total: 3500, id_metodo: 'M1' }, 5);

      expect(result).toMatchObject({
        message: 'Venta registrada con exito',
        ticketId: '99',
        total: 3500,
      });
      expect(connection.commit).toHaveBeenCalled();
    });

    it('CP-097 - debe rechazar un método de pago no soportado', async () => {
      const connection = {
        beginTransaction: jest.fn(),
        query: jest.fn(() => Promise.resolve([[]])),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(connection);

      await expect(
        service.createOrder({ items: [{ id: '1', cantidad: 1 }], total: 3500, id_metodo: 'M999' }, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('CP-100 - debe rechazar la compra cuando el stock es insuficiente y hacer rollback', async () => {
      const connection = {
        beginTransaction: jest.fn(),
        query: jest.fn((sql: string) => {
          if (sql.includes('SELECT id_metodo')) {
            return Promise.resolve([[{ id_metodo: 'M1' }]]);
          }

          if (sql.includes('INSERT INTO venta')) {
            return Promise.resolve([{ insertId: 88 }]);
          }

          if (sql.includes('SELECT p.nombre, p.precio, sa.stock')) {
            return Promise.resolve([[{ nombre: 'Arroz', precio: 3500, stock: 1 }]]);
          }

          return Promise.resolve([[]]);
        }),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(connection);

      await expect(service.createOrder({ items: [{ id: '1', cantidad: 2 }], total: 7000, id_metodo: 'M1' }, 5)).rejects.toThrow(ConflictException);
      expect(connection.rollback).toHaveBeenCalled();
    });

    it('CP-101 - debe manejar errores de base de datos con rollback', async () => {
      const connection = {
        beginTransaction: jest.fn(),
        query: jest.fn(() => {
          throw new Error('DB failure during transaction');
        }),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      db.getConnection.mockResolvedValue(connection);

      await expect(service.createOrder({ items: [{ id: '1', cantidad: 1 }], total: 3500, id_metodo: 'M1' }, 5)).rejects.toThrow(InternalServerErrorException);
      expect(connection.rollback).toHaveBeenCalled();
    });
  });
});
