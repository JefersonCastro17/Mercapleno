import { Injectable } from '@nestjs/common';
import { PostgresService, DbConnection, DbQueryResult } from './postgres.service';

export type PoolConnection = DbConnection;
export type FieldPacket = any;

@Injectable()
export class MysqlService extends PostgresService {}

