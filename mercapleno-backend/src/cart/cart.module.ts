import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { MysqlModule } from '../common/database/mysql.module';

@Module({
  imports: [MysqlModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
