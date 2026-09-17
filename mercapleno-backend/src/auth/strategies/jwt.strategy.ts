import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { envs } from '../../config';
import { AuthUser } from '../interfaces/auth-user.interface';

import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string | number;
  id_rol: number;
  email: string;
  token_type: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: (req: Request) => {
        let token = null;

        if (req && req.cookies) {
          token = req.cookies.access_token;
        }

        if (!token && req?.headers?.authorization) {
          const authHeader = req.headers.authorization as string;
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          }
        }

        return token;
      },
      ignoreExpiration: false,
      secretOrKey: envs.jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (
      payload.sub === undefined ||
      payload.sub === null ||
      !payload.email ||
      payload.id_rol === undefined ||
      payload.token_type !== 'access'
    ) {
      throw new UnauthorizedException('Token invalido');
    }

    const userId = Number(payload.sub);
    const userExists = await this.prisma.usuarios.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      throw new UnauthorizedException('El usuario ha sido eliminado');
    }

    return {
      id: userId,
      id_rol: payload.id_rol,
      email: payload.email,
    };
  }
}
