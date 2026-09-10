import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../../src/inventory/inventory.service';
import { MysqlService } from '../../../src/common/database/mysql.service';
import { EmailService } from '../../../src/email/email.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let mysqlService: any;
  let emailService: any;

  const connectionMock = {
    beginTransaction: jest.fn(),
    execute: jest.fn(),
    query: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    connectionMock.execute.mockResolvedValue([{ insertId: 1, affectedRows: 1 }]);
    connectionMock.query.mockResolvedValue([[]]);
    connectionMock.beginTransaction.mockResolvedValue(undefined);
    connectionMock.commit.mockResolvedValue(undefined);
    connectionMock.rollback.mockResolvedValue(undefined);
    connectionMock.release.mockResolvedValue(undefined);

    const dbMock = {
      query: jest.fn(),
      getConnection: jest.fn().mockResolvedValue(connectionMock),
    };

    const emMock = {
      sendLowStockAlertToAdmins: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: MysqlService, useValue: dbMock },
        { provide: EmailService, useValue: emMock },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    mysqlService = module.get(MysqlService);
    emailService = module.get(EmailService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getProductsWithStock', () => {
    it('debe retornar lista de productos con metadatos de stock', async () => {
      const mockRows = [{ id: 1, nombre: 'Producto 1', precio: 100, imagen: null, categoria: 'Cat1', stock: 10 }];
      mysqlService.query.mockResolvedValue([mockRows]);
      
      const result = await service.getProductsWithStock();
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(mysqlService.query).toHaveBeenCalled();
    });
  });

  describe('getReferenceDocuments', () => {
    it('debe retornar documentos de referencia', async () => {
      const mockDocs = [{ id_documento: 'CC', label: 'CC', total_usos: 3 }];
      mysqlService.query.mockResolvedValue([mockDocs]);
      
      const result = await service.getReferenceDocuments('ENTRADA');
      expect(result).toBeDefined();
      expect(mysqlService.query).toHaveBeenCalled();
    });

    it('debe retornar documentos sin filtro de tipo', async () => {
      const mockDocs = [{ id_documento: 'CC', label: 'CC', total_usos: 5 }];
      mysqlService.query.mockResolvedValue([mockDocs]);
      
      const result = await service.getReferenceDocuments();
      expect(result).toBeDefined();
    });
  });

  describe('registerMovement', () => {
    it('debe registrar entrada exitosamente', async () => {
      const dto = { id_producto: 1, tipo_movimiento: 'ENTRADA' as const, cantidad: 10, id_documento: 'CC' };
      
      // query for stock snapshot
      connectionMock.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Producto 1', stock: 20 }]]);
      
      const result = await service.registerMovement(dto, 1);
      
      expect(result.message).toBe('Movimiento registrado con exito');
      expect(connectionMock.beginTransaction).toHaveBeenCalled();
      expect(connectionMock.commit).toHaveBeenCalled();
      expect(connectionMock.release).toHaveBeenCalled();
    });

    it('debe asignar ND por defecto si id_documento no es proporcionado', async () => {
      const dto = { id_producto: 1, tipo_movimiento: 'ENTRADA' as const, cantidad: 10 };
      
      // query for stock snapshot
      connectionMock.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Producto 1', stock: 20 }]]);
      
      const result = await service.registerMovement(dto as any, 1);
      
      expect(result.message).toBe('Movimiento registrado con exito');
      expect(connectionMock.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO entrada_productos'),
        expect.arrayContaining(['ND']),
      );
    });

    it('debe registrar salida exitosamente', async () => {
      const dto = { id_producto: 1, tipo_movimiento: 'SALIDA' as const, cantidad: 5, id_documento: 'CC' };
      
      // query for stock check (FOR UPDATE)
      connectionMock.query.mockResolvedValueOnce([[{ stock: 10 }]]);
      // query for stock snapshot
      connectionMock.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Producto 1', stock: 5 }]]);
      
      const result = await service.registerMovement(dto, 1);
      
      expect(result.message).toBe('Movimiento registrado con exito');
      expect(connectionMock.beginTransaction).toHaveBeenCalled();
      expect(connectionMock.commit).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si stock insuficiente', async () => {
      const dto = { id_producto: 1, tipo_movimiento: 'SALIDA' as const, cantidad: 15, id_documento: 'CC' };
      
      // query for stock check - insufficient stock (5 < 15)
      connectionMock.query.mockResolvedValueOnce([[{ stock: 5 }]]);
      
      await expect(service.registerMovement(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('debe hacer rollback si hay error inesperado en la base de datos', async () => {
      const dto = { id_producto: 1, tipo_movimiento: 'ENTRADA' as const, cantidad: 10, id_documento: 'CC' };
      connectionMock.execute.mockRejectedValue(new Error('DB Error'));
      
      await expect(service.registerMovement(dto, 1)).rejects.toThrow(InternalServerErrorException);
      expect(connectionMock.rollback).toHaveBeenCalled();
      expect(connectionMock.release).toHaveBeenCalled();
    });
  });
});
