import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { envs } from '../config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: envs.jwtSecret,
      signOptions: { expiresIn: envs.jwtExpiresIn as any },
    }),
  ],
  controllers: [AuthController], // Agrega AuthController a los controllers
  providers: [AuthService, JwtStrategy], // Agrega JwtStrategy a los providers
  exports: [JwtModule, PassportModule], // Exporta JwtModule y PassportModule para que puedan ser usados en otros módulos
})
export class AuthModule {}
