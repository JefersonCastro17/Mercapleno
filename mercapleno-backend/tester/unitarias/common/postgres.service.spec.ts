import {
  translateSqlToPostgres,
  formatPostgresResult,
  PostgresService,
} from '../../../src/common/database/postgres.service';
import * as databaseModule from '../../../src/common/database';

jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mClient),
    end: jest.fn().mockResolvedValue(undefined),
  };
  return {
    Pool: jest.fn(() => mPool),
  };
});

describe('PostgresService and Helpers', () => {
  describe('Database module re-exports', () => {
    it('debe re-exportar servicios de base de datos', () => {
      expect(databaseModule).toBeDefined();
    });
  });

  describe('translateSqlToPostgres', () => {
    it('debe reemplazar CURDATE() por CURRENT_DATE', () => {
      const sql = 'SELECT * FROM ventas WHERE fecha >= CURDATE()';
      expect(translateSqlToPostgres(sql)).toBe('SELECT * FROM ventas WHERE fecha >= CURRENT_DATE');
    });

    it('debe reemplazar DATE_FORMAT con %Y-%m y %Y-%m-%d', () => {
      const sql1 = "SELECT DATE_FORMAT(fecha, '%Y-%m') FROM reportes";
      expect(translateSqlToPostgres(sql1)).toBe("SELECT TO_CHAR(fecha, 'YYYY-MM') FROM reportes");

      const sql2 = "SELECT DATE_FORMAT(fecha, '%Y-%m-%d') FROM reportes";
      expect(translateSqlToPostgres(sql2)).toBe("SELECT TO_CHAR(fecha, 'YYYY-MM-DD') FROM reportes");
    });

    it('debe reemplazar signos de interrogacion posicionales por $1, $2, etc.', () => {
      const sql = 'SELECT * FROM usuarios WHERE id = ? AND email = ?';
      expect(translateSqlToPostgres(sql)).toBe('SELECT * FROM usuarios WHERE id = $1 AND email = $2');
    });

    it('debe agregar RETURNING * a INSERT INTO si no lo tiene', () => {
      const sql = 'INSERT INTO productos (nombre, precio) VALUES ($1, $2)';
      expect(translateSqlToPostgres(sql)).toBe('INSERT INTO productos (nombre, precio) VALUES ($1, $2) RETURNING *');
    });

    it('no debe duplicar RETURNING si ya existe en el INSERT', () => {
      const sql = 'INSERT INTO productos (nombre) VALUES ($1) RETURNING id_productos';
      expect(translateSqlToPostgres(sql)).toBe('INSERT INTO productos (nombre) VALUES ($1) RETURNING id_productos');
    });
  });

  describe('formatPostgresResult', () => {
    it('debe formatear resultado para INSERT extrayendo insertId y affectedRows', () => {
      const mockQueryResult: any = {
        rowCount: 1,
        rows: [{ id_productos: 99, nombre: 'Arroz' }],
        fields: [{ name: 'id_productos' }],
      };

      const [result] = formatPostgresResult(mockQueryResult, 'INSERT INTO productos (nombre) VALUES ($1)');
      expect(result.insertId).toBe(99);
      expect(result.affectedRows).toBe(1);
      expect(result.nombre).toBe('Arroz');
    });

    it('debe manejar INSERT sin filas retornando insertId 0', () => {
      const mockQueryResult: any = {
        rowCount: 0,
        rows: [],
        fields: [],
      };

      const [result] = formatPostgresResult(mockQueryResult, 'INSERT INTO productos (nombre) VALUES ($1)');
      expect(result.insertId).toBe(0);
      expect(result.affectedRows).toBe(0);
    });

    it('debe formatear resultado para UPDATE o DELETE', () => {
      const mockQueryResult: any = {
        rowCount: 3,
        rows: [],
        fields: [],
      };

      const [resultUpdate] = formatPostgresResult(mockQueryResult, 'UPDATE productos SET precio = 10');
      expect(resultUpdate.affectedRows).toBe(3);

      const [resultDelete] = formatPostgresResult(mockQueryResult, 'DELETE FROM productos WHERE id = 1');
      expect(resultDelete.affectedRows).toBe(3);
    });

    it('debe retornar filas y campos para consultas SELECT ordinarias', () => {
      const mockQueryResult: any = {
        rowCount: 2,
        rows: [{ id: 1 }, { id: 2 }],
        fields: [{ name: 'id' }],
      };

      const [rows, fields] = formatPostgresResult(mockQueryResult, 'SELECT * FROM usuarios');
      expect(rows).toEqual([{ id: 1 }, { id: 2 }]);
      expect(fields).toEqual([{ name: 'id' }]);
    });
  });

  describe('PostgresService class and connection wrapper', () => {
    let service: PostgresService;
    let poolMock: any;

    beforeEach(() => {
      jest.clearAllMocks();
      service = new PostgresService();
      poolMock = (service as any).pool;
    });

    it('debe ejecutar query traduciendo SQL y formateando el resultado', async () => {
      poolMock.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 1, nombre: 'Test' }],
        fields: [],
      });

      const [rows] = await service.query('SELECT * FROM test WHERE id = ?', [1]);
      expect(poolMock.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [1]);
      expect(rows).toEqual([{ id: 1, nombre: 'Test' }]);
    });

    it('debe llamar execute delegando en query', async () => {
      const querySpy = jest.spyOn(service, 'query').mockResolvedValue([[], []] as any);
      await service.execute('SELECT 1', []);
      expect(querySpy).toHaveBeenCalledWith('SELECT 1', []);
    });

    it('debe obtener conexion y soportar transacciones, execute, query y release', async () => {
      const conn = await service.getConnection();
      expect(conn).toBeDefined();

      const clientMock = (conn as any).client;
      clientMock.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 10 }],
        fields: [],
      });

      await conn.beginTransaction();
      expect(clientMock.query).toHaveBeenCalledWith('BEGIN');

      await conn.query('SELECT * FROM test WHERE id = ?', [10]);
      expect(clientMock.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [10]);

      await conn.execute('SELECT 1');

      await conn.commit();
      expect(clientMock.query).toHaveBeenCalledWith('COMMIT');

      await conn.rollback();
      expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');

      conn.release();
      expect(clientMock.release).toHaveBeenCalled();
    });

    it('debe cerrar el pool en onModuleDestroy', async () => {
      await service.onModuleDestroy();
      expect(poolMock.end).toHaveBeenCalled();
    });
  });
});

