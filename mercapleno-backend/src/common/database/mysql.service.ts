import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPool, FieldPacket, Pool, PoolConnection } from 'mysql2/promise';
import { envs } from '../../config';

@Injectable()
export class MysqlService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = createPool({
      host: envs.dbHost,
      port: envs.dbPort,
      user: envs.dbUser,
      password: envs.dbPassword,
      database: envs.dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<[T, FieldPacket[]]> {
    return this.pool.execute(sql, params) as Promise<[T, FieldPacket[]]>;
  }

  async getConnection(): Promise<PoolConnection> {
    return this.pool.getConnection();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
