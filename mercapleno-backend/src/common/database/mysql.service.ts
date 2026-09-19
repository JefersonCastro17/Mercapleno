import { Injectable } from '@nestjs/common';
import { PostgresService, DbConnection } from './postgres.service';

export type PoolConnection = DbConnection;

@Injectable()
export class MysqlService extends PostgresService {}

