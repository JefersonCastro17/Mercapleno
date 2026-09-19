import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../../../src/reports/reports.service';
import { ReportsController } from '../../../src/reports/reports.controller';
import { MysqlService } from '../../../src/common/database/mysql.service';

describe('ReportsService Financial and Category Analytics (Real Implementation)', () => {
  let service: ReportsService;
  let controller: ReportsController;
  let dbMock: { query: jest.Mock };

  beforeEach(async () => {
    dbMock = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        ReportsService,
        {
          provide: MysqlService,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    controller = module.get<ReportsController>(ReportsController);
  });

  describe('getFinancialSummary', () => {
    it('debe calcular correctamente el resumen financiero con filtros de fecha', async () => {
      const mockVentas = [
        {
          total_ventas: 10,
          ingresos_totales: 50000,
          ticket_promedio: 5000,
          costo_estimado: 30000,
        },
      ];
      const mockInventario = [
        {
          unidades_stock_total: 100,
          valor_inventario_venta: 100000,
          valor_inventario_costo: 70000,
          productos_stock_bajo: 3,
        },
      ];

      dbMock.query
        .mockResolvedValueOnce([[mockVentas[0]]])
        .mockResolvedValueOnce([[mockInventario[0]]]);

      const result = await service.getFinancialSummary('2026-01-01', '2026-01-31');

      expect(result.ingresos_totales).toBe(50000);
      expect(result.costo_estimado).toBe(30000);
      expect(result.ganancia_bruta).toBe(20000);
      expect(result.margen_porcentaje).toBe(40);
      expect(result.ticket_promedio).toBe(5000);
      expect(result.total_ventas).toBe(10);
      expect(result.inventario.unidades_stock_total).toBe(100);
      expect(result.inventario.productos_stock_bajo).toBe(3);
    });

    it('debe manejar ventas nulas o sin datos asignando ceros', async () => {
      dbMock.query
        .mockResolvedValueOnce([[null]])
        .mockResolvedValueOnce([[null]]);

      const result = await service.getFinancialSummary();

      expect(result.ingresos_totales).toBe(0);
      expect(result.costo_estimado).toBe(0);
      expect(result.ganancia_bruta).toBe(0);
      expect(result.margen_porcentaje).toBe(0);
      expect(result.inventario.unidades_stock_total).toBe(0);
    });

    it('controlador debe delegar getFinancialSummary', async () => {
      jest.spyOn(service, 'getFinancialSummary').mockResolvedValue({ total_ventas: 1 } as any);
      const res = await controller.getFinancialSummary('2026-01-01', '2026-01-31');
      expect(res).toEqual({ total_ventas: 1 });
    });
  });

  describe('getVentasPorCategoria', () => {
    it('debe retornar desglose de ventas por categoria', async () => {
      const mockRows = [{ categoria: 'Lácteos', unidades_vendidas: 15, total_ingresos: 45000 }];
      dbMock.query.mockResolvedValueOnce([mockRows]);

      const result = await service.getVentasPorCategoria();
      expect(result).toEqual(mockRows);
    });

    it('controlador debe delegar getVentasPorCategoria', async () => {
      jest.spyOn(service, 'getVentasPorCategoria').mockResolvedValue([] as any);
      const res = await controller.getVentasPorCategoria();
      expect(res).toEqual([]);
    });
  });

  describe('getVentasPorMetodo', () => {
    it('debe retornar desglose de ventas por metodo de pago', async () => {
      const mockRows = [{ metodo: 'Efectivo', transacciones: 20, total_recaudado: 80000 }];
      dbMock.query.mockResolvedValueOnce([mockRows]);

      const result = await service.getVentasPorMetodo();
      expect(result).toEqual(mockRows);
    });

    it('controlador debe delegar getVentasPorMetodo', async () => {
      jest.spyOn(service, 'getVentasPorMetodo').mockResolvedValue([] as any);
      const res = await controller.getVentasPorMetodo();
      expect(res).toEqual([]);
    });
  });

  describe('getProductosRentabilidad', () => {
    it('debe retornar ranking de rentabilidad de productos', async () => {
      const mockRows = [
        {
          id_productos: 1,
          nombre: 'Arroz',
          categoria: 'Granos',
          unidades_vendidas: 50,
          total_facturado: 150000,
          ganancia_total: 45000,
          margen_pct: 30,
        },
      ];
      dbMock.query.mockResolvedValueOnce([mockRows]);

      const result = await service.getProductosRentabilidad();
      expect(result).toEqual(mockRows);
    });

    it('controlador debe delegar getProductosRentabilidad', async () => {
      jest.spyOn(service, 'getProductosRentabilidad').mockResolvedValue([] as any);
      const res = await controller.getProductosRentabilidad();
      expect(res).toEqual([]);
    });
  });
});

