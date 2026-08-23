import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { envs } from '../config';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyLoginCodeDto } from './dto/verify-login-code.dto';

interface AuthTokenPayload {
  sub: number;
  id_rol: number;
  email: string;
  token_type: 'access' | 'login_2fa';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private buildExpiresAt(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private isExpired(expiresAt: Date | string | null | undefined): boolean {
    if (!expiresAt) {
      return true;
    }
    return new Date(expiresAt).getTime() < Date.now();
  }

  private requiresLoginTwoFactor(idRol: number): boolean {
    return idRol === 1 || idRol === 2;
  }

  private buildUserResponse(user: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    id_rol: number;
    email_verified: boolean;
    roles?: { nombre: string } | null;
    tipos_identificacion?: { nombre: string } | null;
  }) {
    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      id_rol: user.id_rol,
      email_verified: user.email_verified,
      rol: user.roles?.nombre,
      tipo_documento: user.tipos_identificacion?.nombre,
    };
  }
// token a
  private buildAccessToken(user: { id: number; id_rol: number; email: string }): string {
    return this.jwtService.sign({
      sub: user.id,
      id_rol: user.id_rol,
      email: user.email,
      token_type: 'access',
    });
  }
//token b
  private buildPendingLoginToken(user: { id: number; id_rol: number; email: string }): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        id_rol: user.id_rol,
        email: user.email,
        token_type: 'login_2fa',
      },
      {
        expiresIn: `${envs.loginTwoFactorTtlMin}m`,
      },
    );
  }

  private async clearLoginTwoFactorChallenge(userId: number): Promise<void> {
    await this.prisma.usuarios.update({
      where: { id: userId },
      data: {
        login_two_factor_code: null,
        login_two_factor_expires: null,
      },
    });
  }

  private async createLoginTwoFactorChallenge(user: {
    id: number;
    email: string;
    id_rol: number;
    roles?: { nombre: string } | null;
  }) {
    const loginCode = this.generateCode();
    const loginCodeHash = this.hashCode(loginCode);
    const loginCodeExpiresAt = this.buildExpiresAt(envs.loginTwoFactorTtlMin);

    await this.prisma.usuarios.update({
      where: { id: user.id },
      data: {
        login_two_factor_code: loginCodeHash,
        login_two_factor_expires: loginCodeExpiresAt,
      },
    });

    try {
      await this.emailService.sendLoginTwoFactorCode(
        user.email,
        loginCode,
        envs.loginTwoFactorTtlMin,
        user.roles?.nombre,
      );
    } catch (_error) {
      await this.clearLoginTwoFactorChallenge(user.id);
      throw new InternalServerErrorException({
        success: false,
        message: 'No se pudo enviar el codigo de segundo factor. Intenta nuevamente.',
      });
    }

    return {
      success: true,
      message: 'Enviamos un codigo de segundo factor a tu correo para completar el inicio de sesion.',
      requiresTwoFactor: true,
      pendingToken: this.buildPendingLoginToken(user),
      twoFactorExpiresInMinutes: envs.loginTwoFactorTtlMin,
      user: {
        id: user.id,
        email: user.email,
        id_rol: user.id_rol,
        rol: user.roles?.nombre,
      },
    };
  }

  private verifyPendingLoginToken(token: string): AuthTokenPayload {
    try {
      const payload = this.jwtService.verify<AuthTokenPayload>(token);

      if (
        payload.sub === undefined ||
        payload.sub === null ||
        !payload.email ||
        payload.id_rol === undefined ||
        payload.token_type !== 'login_2fa'
      ) {
        throw new UnauthorizedException('Token invalido');
      }

      return payload;
    } catch (_error) {
      throw new UnauthorizedException({
        success: false,
        message: 'La verificacion de segundo factor ya no es valida. Vuelve a iniciar sesion.',
      });
    }
  }

  async getDocumentTypes() {
    const tiposIdentificacion = await this.prisma.tipos_identificacion.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return {
      success: true,
      tipos_identificacion: tiposIdentificacion,
    };
  }

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.usuarios.findFirst({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingEmail) {
      throw new ConflictException({
        success: false,
        message: 'El correo electronico ya esta registrado.',
      });
    }

    const existingDoc = await this.prisma.usuarios.findFirst({
      where: { numero_identificacion: dto.numero_identificacion },
      select: { id: true },
    });

    if (existingDoc) {
      throw new ConflictException({
        success: false,
        message: 'El numero de identificacion ya esta registrado.',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const rolClienteID = 3;
    const verificationCode = this.generateCode();
    const verificationHash = this.hashCode(verificationCode);
    const verificationExpiresAt = this.buildExpiresAt(envs.emailVerificationTtlMin);

    try {
      await this.prisma.usuarios.create({
        data: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          email: dto.email,
          password: hashedPassword,
          direccion: dto.direccion,
          fecha_nacimiento: new Date(dto.fecha_nacimiento),
          id_rol: rolClienteID,
          id_tipo_identificacion: dto.id_tipo_identificacion,
          numero_identificacion: dto.numero_identificacion,
          email_verified: false,
          email_verification_code: verificationHash,
          email_verification_expires: verificationExpiresAt,
        },
      });

      let emailSent = false;
      try {
        await this.emailService.sendVerificationCode(
          dto.email,
          verificationCode,
          envs.emailVerificationTtlMin,
        );
        emailSent = true;
      } catch (_error) {
        emailSent = false;
      }

      return {
        success: true,
        message: emailSent
          ? 'Usuario registrado. Enviamos un codigo de verificacion a tu correo.'
          : 'Usuario registrado, pero no se pudo enviar el correo. Usa reenviar codigo.',
        requiresVerification: true,
        emailSent,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = String(error.meta?.target || '');
        if (target.includes('email')) {
          throw new ConflictException({
            success: false,
            message: 'El correo electronico ya esta registrado.',
          });
        }
        if (target.includes('numero_identificacion')) {
          throw new ConflictException({
            success: false,
            message: 'El numero de identificacion ya esta registrado.',
          });
        }
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'Error interno del servidor al registrar.',
      });
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.usuarios.findFirst({
      where: { email: dto.email },
      include: {
        roles: true,
        tipos_identificacion: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ success: false, message: 'Usuario no encontrado' });
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new ForbiddenException({ success: false, message: 'Contrasena incorrecta' });
    }

    if (!user.email_verified) {
      throw new ForbiddenException({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Debes verificar tu correo antes de iniciar sesion.',
      });
    }

    if (this.requiresLoginTwoFactor(user.id_rol)) {
      return this.createLoginTwoFactorChallenge(user);
    }

    await this.clearLoginTwoFactorChallenge(user.id);

    const token = this.buildAccessToken(user);

    return {
      success: true,
      message: 'Inicio de sesion exitoso',
      token,
      user: this.buildUserResponse(user),
    };
  }

  async verifyLoginCode(dto: VerifyLoginCodeDto) {
    const pendingPayload = this.verifyPendingLoginToken(dto.pendingToken);

    const user = await this.prisma.usuarios.findFirst({
      where: {
        id: Number(pendingPayload.sub),
        email: pendingPayload.email,
      },
      include: {
        roles: true,
        tipos_identificacion: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ success: false, message: 'Usuario no encontrado' });
    }

    if (!this.requiresLoginTwoFactor(user.id_rol)) {
      throw new BadRequestException({
        success: false,
        message: 'Este usuario no requiere segundo factor.',
      });
    }

    if (!user.login_two_factor_code || !user.login_two_factor_expires) {
      throw new BadRequestException({
        success: false,
        message: 'No hay un codigo activo de segundo factor. Vuelve a iniciar sesion.',
      });
    }

    if (this.isExpired(user.login_two_factor_expires)) {
      await this.clearLoginTwoFactorChallenge(user.id);
      throw new BadRequestException({
        success: false,
        message: 'El codigo de segundo factor ha expirado. Vuelve a iniciar sesion.',
      });
    }

    if (this.hashCode(dto.code) !== user.login_two_factor_code) {
      throw new ForbiddenException({
        success: false,
        message: 'Codigo de segundo factor incorrecto.',
      });
    }

    await this.clearLoginTwoFactorChallenge(user.id);

    const token = this.buildAccessToken(user);

    return {
      success: true,
      message: 'Inicio de sesion exitoso',
      token,
      user: this.buildUserResponse(user),
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.usuarios.findFirst({
      where: { email: dto.email },
      select: {
        id: true,
        email_verified: true,
        email_verification_code: true,
        email_verification_expires: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.email_verified) {
      return { success: true, message: 'El correo ya esta verificado.' };
    }

    if (!user.email_verification_code || !user.email_verification_expires) {
      throw new BadRequestException({
        success: false,
        message: 'No hay un codigo activo. Solicita reenviar.',
      });
    }

    if (this.isExpired(user.email_verification_expires)) {
      throw new BadRequestException({
        success: false,
        message: 'El codigo ha expirado. Solicita reenviar.',
      });
    }

    if (this.hashCode(dto.code) !== user.email_verification_code) {
      throw new ForbiddenException({ success: false, message: 'Codigo incorrecto.' });
    }

    await this.prisma.usuarios.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        email_verification_code: null,
        email_verification_expires: null,
      },
    });

    return { success: true, message: 'Correo verificado correctamente.' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.usuarios.findFirst({
      where: { email: dto.email },
      select: { id: true, email_verified: true },
    });

    if (!user) {
      throw new NotFoundException({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.email_verified) {
      return { success: true, message: 'El correo ya esta verificado.' };
    }

    const verificationCode = this.generateCode();
    const verificationHash = this.hashCode(verificationCode);
    const verificationExpiresAt = this.buildExpiresAt(envs.emailVerificationTtlMin);

    await this.prisma.usuarios.update({
      where: { id: user.id },
      data: {
        email_verification_code: verificationHash,
        email_verification_expires: verificationExpiresAt,
      },
    });

    await this.emailService.sendVerificationCode(
      dto.email,
      verificationCode,
      envs.emailVerificationTtlMin,
    );

    return { success: true, message: 'Codigo reenviado. Revisa tu correo.' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.usuarios.findFirst({
      where: { email: dto.email },
      select: { id: true },
    });

    if (!user) {
      return { success: true, message: 'Si el correo existe, se envio un codigo.' };
    }

    const resetCode = this.generateCode();
    const resetHash = this.hashCode(resetCode);
    const resetExpiresAt = this.buildExpiresAt(envs.passwordResetTtlMin);

    await this.prisma.usuarios.update({
      where: { id: user.id },
      data: {
        password_reset_code: resetHash,
        password_reset_expires: resetExpiresAt,
      },
    });

    await this.emailService.sendPasswordResetCode(dto.email, resetCode, envs.passwordResetTtlMin);

    return { success: true, message: 'Si el correo existe, se envio un codigo.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.usuarios.findFirst({
      where: { email: dto.email },
      select: {
        id: true,
        password_reset_code: true,
        password_reset_expires: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ success: false, message: 'Usuario no encontrado' });
    }

    if (!user.password_reset_code || !user.password_reset_expires) {
      throw new BadRequestException({
        success: false,
        message: 'No hay un codigo activo. Solicita uno nuevo.',
      });
    }

    if (this.isExpired(user.password_reset_expires)) {
      throw new BadRequestException({
        success: false,
        message: 'El codigo ha expirado. Solicita uno nuevo.',
      });
    }

    if (this.hashCode(dto.code) !== user.password_reset_code) {
      throw new ForbiddenException({ success: false, message: 'Codigo incorrecto.' });
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.usuarios.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        password_reset_code: null,
        password_reset_expires: null,
      },
    });

    return { success: true, message: 'Contrasena actualizada correctamente.' };
  }

  logout() {
    return {
      success: true,
      message: 'Sesion cerrada (token invalidado por el cliente)',
    };
  }
}
