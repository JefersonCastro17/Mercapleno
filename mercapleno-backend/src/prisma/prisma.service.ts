import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { envs } from '../config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: envs.databaseUrl,
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `No se pudo conectar a la base de datos al iniciar. Se reintentara en las siguientes consultas. Detalle: ${detail}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
