import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';
import { envs } from '../../config';

export interface DbQueryResult {
  insertId?: number | string;
  affectedRows?: number;
  [key: string]: any;
}

export interface DbConnection {
  query<T = any>(sql: string, params?: any[]): Promise<[T, any[]]>;
  execute<T = any>(sql: string, params?: any[]): Promise<[T, any[]]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

export function translateSqlToPostgres(sql: string): string {
  let translated = sql;

  // Reemplazar funciones de fecha comunes de MySQL
  translated = translated.replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE');
  translated = translated.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m'\s*\)/gi, 'TO_CHAR($1, \'YYYY-MM\')');
  translated = translated.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m-%d'\s*\)/gi, 'TO_CHAR($1, \'YYYY-MM-DD\')');

  // Reemplazar parámetros posicionales '?' por '$1', '$2', ...
  let paramIndex = 1;
  translated = translated.replace(/\?/g, () => `$${paramIndex++}`);

  // Para INSERTs sin RETURNING, agregar RETURNING * para capturar el insertId
  const trimmed = translated.trim();
  if (/^INSERT\s+INTO\s+/i.test(trimmed) && !/RETURNING/i.test(trimmed)) {
    translated = `${trimmed} RETURNING *`;
  }

  return translated;
}

export function formatPostgresResult<T = any>(res: QueryResult<any>, originalSql: string): [T, any[]] {
  const isInsert = /^\s*INSERT\s+INTO/i.test(originalSql);
  const isUpdateOrDelete = /^\s*(UPDATE|DELETE)\s+/i.test(originalSql);

  if (isInsert) {
    const firstRow = res.rows?.[0];
    const insertId =
      firstRow?.id ??
      firstRow?.id_movimiento ??
      firstRow?.id_venta ??
      firstRow?.id_entrada ??
      firstRow?.id_salida ??
      firstRow?.id_productos ??
      firstRow?.id_inventario ??
      firstRow?.id_devolucion ??
      firstRow?.id_categoria ??
      firstRow?.id_proveedor ??
      firstRow?.id_rol ??
      firstRow?.id_tipo ??
      firstRow?.id_tipo_devolucion ??
      firstRow?.id_metodo ??
      0;

    const resultObj: DbQueryResult = {
      insertId,
      affectedRows: res.rowCount ?? (res.rows?.length || 0),
      rows: res.rows,
      ...firstRow,
    };

    return [resultObj as unknown as T, res.fields as any[]];
  }

  if (isUpdateOrDelete) {
    const resultObj: DbQueryResult = {
      affectedRows: res.rowCount ?? 0,
    };
    return [resultObj as unknown as T, res.fields as any[]];
  }

  return [res.rows as unknown as T, res.fields as any[]];
}

class PostgresConnectionWrapper implements DbConnection {
  constructor(private readonly client: PoolClient) {}

  async query<T = any>(sql: string, params: any[] = []): Promise<[T, any[]]> {
    const pgSql = translateSqlToPostgres(sql);
    const res = await this.client.query(pgSql, params);
    return formatPostgresResult<T>(res, sql);
  }

  async execute<T = any>(sql: string, params: any[] = []): Promise<[T, any[]]> {
    return this.query<T>(sql, params);
  }

  async beginTransaction(): Promise<void> {
    await this.client.query('BEGIN');
  }

  async commit(): Promise<void> {
    await this.client.query('COMMIT');
  }

  async rollback(): Promise<void> {
    await this.client.query('ROLLBACK');
  }

  release(): void {
    this.client.release();
  }
}

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private readonly pool: Pool;

  constructor() {
    if (envs.databaseUrl) {
      const isSsl =
        envs.databaseUrl.includes('sslmode=require') ||
        envs.databaseUrl.includes('neon.tech') ||
        envs.databaseUrl.includes('render.com') ||
        envs.databaseUrl.includes('supabase');

      this.pool = new Pool({
        connectionString: envs.databaseUrl,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
      });
    } else {
      this.pool = new Pool({
        host: envs.dbHost,
        port: envs.dbPort,
        user: envs.dbUser,
        password: envs.dbPassword,
        database: envs.dbName,
        max: 10,
      });
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<[T, any[]]> {
    const pgSql = translateSqlToPostgres(sql);
    const res = await this.pool.query(pgSql, params);
    return formatPostgresResult<T>(res, sql);
  }

  async execute<T = any>(sql: string, params: any[] = []): Promise<[T, any[]]> {
    return this.query<T>(sql, params);
  }

  async getConnection(): Promise<DbConnection> {
    const client = await this.pool.connect();
    return new PostgresConnectionWrapper(client);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}