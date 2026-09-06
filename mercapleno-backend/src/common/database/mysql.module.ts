import { Global, Module } from '@nestjs/common';
import { MysqlService } from './mysql.service';
import { PostgresService } from './postgres.service';

@Global()
@Module({
  providers: [
    MysqlService,
    {
      provide: PostgresService,
      useExisting: MysqlService,
    },
  ],
  exports: [MysqlService, PostgresService],
})
export class MysqlModule {}

