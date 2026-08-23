import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error Interno del Servidor';
    let errorCode = 'ERR_500_INTERNAL_SERVER_ERROR';

    let additionalResponseData: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObject = exceptionResponse as Record<string, unknown>;
        message = (responseObject.message as string) || exception.message;
        additionalResponseData = responseObject;
        if (responseObject.errorCode && typeof responseObject.errorCode === 'string') {
          errorCode = responseObject.errorCode;
        }
      } else {
        message = exceptionResponse as string;
      }

      if (exception instanceof Error) {
        this.logger.error(exception.stack);
      }

      // Codes específicos por status
      switch (status) {
        case 400:
          errorCode = errorCode || 'ERR_400_BAD_REQUEST';
          break;
        case 401:
          errorCode = errorCode || 'ERR_401_UNAUTHORIZED';
          break;
        case 403:
          errorCode = errorCode || 'ERR_403_FORBIDDEN';
          break;
        case 404:
          errorCode = errorCode || 'ERR_404_NOT_FOUND';
          break;
        case 409:
          errorCode = errorCode || 'ERR_409_CONFLICT';
          break;
        case 422:
          errorCode = errorCode || 'ERR_422_UNPROCESSABLE_ENTITY';
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      
      if (exception.message.includes('CORS')) {
        status = HttpStatus.FORBIDDEN;
        errorCode = 'ERR_403_CORS_BLOCKED';
        message = 'Solicitud bloqueada por política CORS';
      } else if (exception.message.includes('database')) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorCode = 'ERR_500_DATABASE_ERROR';
        message = 'Error de conexión a la base de datos';
      } else if (exception.message.includes('Prisma')) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorCode = 'ERR_500_PRISMA_ERROR';
        message = 'Error en la operación de base de datos';
      }

      this.logger.error(`Error: ${exception.message}`, exception.stack);
    }

    const errorResponse = {
      ...additionalResponseData,
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    this.logger.error(
      `[${errorCode}] ${request.method} ${request.url} - ${message}`,
    );

    response.status(status).json(errorResponse);
  }
}
