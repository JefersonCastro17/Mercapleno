import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { handlePrismaPersistenceError } from '../../../src/common/utils/prisma-error.util';

describe('PrismaErrorUtil (Unitarias)', () => {
  it('debe lanzar ConflictException para error P2002 con target email', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique error', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: 'email' },
    });

    expect(() => handlePrismaPersistenceError(error, 'Fallback')).toThrow(ConflictException);
  });

  it('debe lanzar ConflictException para error P2002 con target numero_identificacion', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique error', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: 'numero_identificacion' },
    });

    expect(() => handlePrismaPersistenceError(error, 'Fallback')).toThrow(ConflictException);
  });

  it('debe lanzar ConflictException genérico para error P2002 con otro target', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique error', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: 'otro_campo' },
    });

    expect(() => handlePrismaPersistenceError(error, 'Fallback')).toThrow(ConflictException);
  });

  it('debe lanzar ConflictException para error P2003 con mensaje de relación', () => {
    const error = new Prisma.PrismaClientKnownRequestError('FK error', {
      code: 'P2003',
      clientVersion: '6.0.0',
    });

    expect(() => handlePrismaPersistenceError(error, 'Fallback', 'Relación no encontrada')).toThrow(
      ConflictException,
    );
  });

  it('debe lanzar InternalServerErrorException para cualquier otro error', () => {
    const error = new Error('Unknown error');

    expect(() => handlePrismaPersistenceError(error, 'Fallback message')).toThrow(
      InternalServerErrorException,
    );
  });
});
