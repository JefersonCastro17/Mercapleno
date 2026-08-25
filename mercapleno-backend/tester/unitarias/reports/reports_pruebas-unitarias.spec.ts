process.env.INTERNAL_API_KEY = 'test-internal-api-key';

import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { ReportsService } from '../../../src/reports/reports.service';
import { ReportsController } from '../../../src/reports/reports.controller';
import { MysqlService } from '../../../src/common/database/mysql.service';

describe('ReportsService (Unitarias)', () => {
  let service: ReportsService;
  let db: { query: jest.Mock };

  beforeEach(async () => {
    db = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: MysqlService,
          useValue: db,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVentasMes', () => {
    it('debe consultar ventas por mes sin filtros de fecha', async () => {
      const mockRows = [
        { mes: '2026-01', total: '150000.00' },
        { mes: '2026-02', total: '230000.00' },
      ];
      db.query.mockResolvedValueOnce([mockRows]);

      const result = await service.getVentasMes();

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY mes ORDER BY mes'),
        [],
      );
      expect(result).toEqual(mockRows);
    });

    it('debe aplicar filtro de fecha inicio cuando se proporciona', async () => {
      const mockRows = [{ mes: '2026-03', total: '120000.00' }];
      db.query.mockResolvedValueOnce([mockRows]);

      const result = await service.getVentasMes('2026-03');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("AND DATE_FORMAT(fecha, '%Y-%m') >= ?"),
        ['2026-03'],
      );
      expect(result).toEqual(mockRows);
    });

    it('debe aplicar filtro de fecha fin cuando se proporciona', async () => {
      const mockRows = [{ mes: '2026-01', total: '90000.00' }];
      db.query.mockResolvedValueOnce([mockRows]);

      const result = await service.getVentasMes(undefined, '2026-01');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("AND DATE_FORMAT(fecha, '%Y-%m') <= ?"),
        ['2026-01'],
      );
      expect(result).toEqual(mockRows);
    });

    it('debe aplicar filtros de inicio y fin simultáneamente', async () => {
      const mockRows = [
        { mes: '2026-02', total: '100000.00' },
        { mes: '2026-03', total: '110000.00' },
      ];
      db.query.mockResolvedValueOnce([mockRows]);

      const result = await service.getVentasMes('2026-02', '2026-03');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "AND DATE_FORMAT(fecha, '%Y-%m') >= ? AND DATE_FORMAT(fecha, '%Y-%m') <= ?",
        ),
        ['2026-02', '2026-03'],
      );
      expect(result).toEqual(mockRows);
    });

    it('debe retornar lista vacía si no hay registros', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await service.getVentasMes('2025-01', '2025-02');

      expect(result).toEqual([]);
    });
  });

  describe('getTopProductos', () => {
    it('debe consultar el top 10 de productos más vendidos', async () => {
      const mockRows = [
        { nombre: 'Arroz Diana 1kg', total_vendido: 50, total_facturado: '200000.00' },
        { nombre: 'Aceite Premier 1L', total_vendido: 30, total_facturado: '270000.00' },
      ];
      db.query.mockResolvedValueOnce([mockRows]);

      const result = await service.getTopProductos();

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY total_vendido DESC'),
      );
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 10'));
      expect(result).toEqual(mockRows);
    });

    it('debe retornar array vacío si no hay ventas de productos', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await service.getTopProductos();

      expect(result).toEqual([]);
    });
  });

  describe('getResumen', () => {
    it('debe consultar los KPIs de resumen de ventas generales', async () => {
      const mockRow = {
        total_ventas: 15,
        dinero_total: '1250000.00',
        promedio: '83333.33',
      };
      db.query.mockResolvedValueOnce([[mockRow]]);

      const result = await service.getResumen();

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) AS total_ventas'),
      );
      expect(result).toEqual(mockRow);
    });

    it('debe retornar undefined o estructura vacía si no hay filas', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await service.getResumen();

      expect(result).toBeUndefined();
    });
  });

  describe('getResumenMes', () => {
    it('debe consultar el resumen mensual de ventas ordenado por mes descendente', async () => {
      const mockRows = [
        { mes: '2026-03', cantidad_ventas: 8, total_mes: '600000.00' },
        { mes: '2026-02', cantidad_ventas: 12, total_mes: '950000.00' },
      ];
      db.query.mockResolvedValueOnce([mockRows]);

      const result = await service.getResumenMes();

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY mes'),
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY mes DESC'),
      );
      expect(result).toEqual(mockRows);
    });

    it('debe retornar array vacío si no hay ventas mensuales', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await service.getResumenMes();

      expect(result).toEqual([]);
    });
  });

  describe('buildResumenPdf', () => {
    it('debe generar un buffer PDF correctamente cuando hay datos completos', async () => {
      const mockResumen = {
        total_ventas: 25,
        dinero_total: 1850000,
        promedio: 74000,
      };
      const mockTopProductos = [
        { nombre: 'Arroz Diana 1kg', total_vendido: 40, total_facturado: 160000 },
        { nombre: 'Aceite Premier 1L', total_vendido: 20, total_facturado: 180000 },
      ];
      const mockResumenMes = [
        { mes: '2026-03', cantidad_ventas: 10, total_mes: 800000 },
        { mes: '2026-02', cantidad_ventas: 15, total_mes: 1050000 },
      ];

      db.query.mockResolvedValueOnce([[mockResumen]]);
      db.query.mockResolvedValueOnce([mockTopProductos]);
      db.query.mockResolvedValueOnce([mockResumenMes]);

      const buffer = await service.buildResumenPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('debe generar un buffer PDF correctamente cuando no hay productos ni resumen mensual', async () => {
      const mockResumen = {
        total_ventas: 0,
        dinero_total: null,
        promedio: null,
      };

      db.query.mockResolvedValueOnce([[mockResumen]]);
      db.query.mockResolvedValueOnce([[]]);
      db.query.mockResolvedValueOnce([[]]);

      const buffer = await service.buildResumenPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('debe generar un buffer PDF manejando resumen con valores undefined', async () => {
      db.query.mockResolvedValueOnce([[{}]]);
      db.query.mockResolvedValueOnce([[]]);
      db.query.mockResolvedValueOnce([[]]);

      const buffer = await service.buildResumenPdf();

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });
});

describe('ReportsController (Unitarias)', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockReportsService = {
    getVentasMes: jest.fn(),
    getTopProductos: jest.fn(),
    getResumen: jest.fn(),
    getResumenMes: jest.fn(),
    buildResumenPdf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getVentasMes', () => {
    it('debe obtener ventas por mes con parámetros de filtro inicio y fin', async () => {
      const mockResult = [
        { mes: '2026-01', total: '150000.00' },
        { mes: '2026-02', total: '200000.00' },
      ];
      mockReportsService.getVentasMes.mockResolvedValueOnce(mockResult);

      const result = await controller.getVentasMes('2026-01', '2026-02');

      expect(service.getVentasMes).toHaveBeenCalledWith('2026-01', '2026-02');
      expect(result).toEqual(mockResult);
    });

    it('debe obtener ventas por mes sin parámetros', async () => {
      const mockResult = [{ mes: '2026-03', total: '350000.00' }];
      mockReportsService.getVentasMes.mockResolvedValueOnce(mockResult);

      const result = await controller.getVentasMes();

      expect(service.getVentasMes).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getTopProductos', () => {
    it('debe delegar la consulta del top de productos al servicio', async () => {
      const mockResult = [
        { nombre: 'Producto A', total_vendido: 10, total_facturado: 50000 },
        { nombre: 'Producto B', total_vendido: 5, total_facturado: 25000 },
      ];
      mockReportsService.getTopProductos.mockResolvedValueOnce(mockResult);

      const result = await controller.getTopProductos();

      expect(service.getTopProductos).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getResumen', () => {
    it('debe delegar la consulta de KPIs de resumen al servicio', async () => {
      const mockResult = {
        total_ventas: 100,
        dinero_total: '5000000.00',
        promedio: '50000.00',
      };
      mockReportsService.getResumen.mockResolvedValueOnce(mockResult);

      const result = await controller.getResumen();

      expect(service.getResumen).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getResumenMes', () => {
    it('debe delegar la consulta del resumen mensual al servicio', async () => {
      const mockResult = [
        { mes: '2026-02', cantidad_ventas: 20, total_mes: '1200000.00' },
      ];
      mockReportsService.getResumenMes.mockResolvedValueOnce(mockResult);

      const result = await controller.getResumenMes();

      expect(service.getResumenMes).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPdfResumen', () => {
    it('debe generar el PDF, establecer los encabezados HTTP y enviar el buffer', async () => {
      const mockBuffer = Buffer.from('%PDF-1.4 Mock PDF Content');
      mockReportsService.buildResumenPdf.mockResolvedValueOnce(mockBuffer);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.getPdfResumen(mockResponse);

      expect(service.buildResumenPdf).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=reporte_ventas.pdf',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });
  });
});
