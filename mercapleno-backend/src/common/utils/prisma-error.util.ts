import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaPersistenceError(
  error: unknown,
  fallbackMessage: string,
  relationMessage?: string,
): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const targetArray = Array.isArray(error.meta?.target) ? error.meta?.target : [];
      if (targetArray.includes('email')) {
        throw new ConflictException({
          success: false,
          message: 'El correo electronico ya esta registrado.',
        });
      }
      if (targetArray.includes('numero_identificacion')) {
        throw new ConflictException({
          success: false,
          message: 'El numero de identificacion ya esta registrado.',
        });
      }
      throw new ConflictException({
        success: false,
        message: 'Ya existe un registro con esos datos.',
      });
    }

    if (error.code === 'P2003' && relationMessage) {
      throw new ConflictException({
        success: false,
        message: relationMessage,
      });
    }
  }

  throw new InternalServerErrorException({
    success: false,
    message: fallbackMessage,
  });
}
