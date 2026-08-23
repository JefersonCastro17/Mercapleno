import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MysqlModule } from './common/database/mysql.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { EmailModule } from './email/email.module';
import { UsersAdminModule } from './users-admin/users-admin.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { ReportsModule } from './reports/reports.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { CartModule } from './cart/cart.module';
import { ApiKeyMiddleware } from './common/logger/logger.middleware';


@Module({
  imports: [
    MysqlModule,
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersAdminModule,
    ProductsModule,
    InventoryModule,
    CartModule,
    SalesModule,
    ReportsModule,
    ProveedoresModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes(
        { path: 'sales/reports', method: RequestMethod.ALL },
        { path: 'admin/users', method: RequestMethod.ALL },
      );

  }
}

