import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { envs } from '../../config';
import { AuthUser } from '../interfaces/auth-user.interface';

interface JwtPayload {
  sub: string | number;
  id_rol: number;
  email: string;
  token_type: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
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

  validate(payload: JwtPayload): AuthUser {
    if (
      payload.sub === undefined ||
      payload.sub === null ||
      !payload.email ||
      payload.id_rol === undefined ||
      payload.token_type !== 'access'
    ) {
      throw new UnauthorizedException('Token invalido');
    }

    return {
      id: Number(payload.sub),
      id_rol: payload.id_rol,
      email: payload.email,
    };
  }
}
