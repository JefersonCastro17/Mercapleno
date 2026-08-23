import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { envs } from '../../config';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.header('x-api-key');

    console.log('[ApiKeyMiddleware] Entro al middleware');
    console.log('[ApiKeyMiddleware] Ruta:', req.method, req.originalUrl);
    console.log('[ApiKeyMiddleware] x-api-key recibida');

    if (!apiKey) {
      console.log('[ApiKeyMiddleware] Bloqueado: falta clave API');
      return res.status(401).json({ message: 'Falta clave API' });
    }

    if (apiKey !== envs.internalApiKey) {
      console.log('[ApiKeyMiddleware] Bloqueado: clave API invalida');
      return res.status(403).json({ message: 'Clave API invalida' });
    }

    console.log('[ApiKeyMiddleware] Clave valida, continua la request');
    next();
  }
}
