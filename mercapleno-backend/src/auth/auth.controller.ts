import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyLoginCodeDto } from './dto/verify-login-code.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAccessTokenCookie(res: Response, req: Request, token: string) {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 2,
    });
  }

  @Get('document-types')
  @Public()
  @ApiOperation({ summary: 'Obtener tipos de identificacion disponibles' })
  getDocumentTypes() {
    return this.authService.getDocumentTypes();
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registrar usuario nuevo' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesion',
    description: 'Para usuarios comunes (rol 3): devuelve token directamente. Para admin/gerentes (rol 1-2): devuelve pendingToken + requiere verificar código 2FA con /verify-login-code',
  })
  
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    if (result && 'token' in result && typeof result.token === 'string' && result.token) {
      this.setAccessTokenCookie(res, req, result.token);
    }

    return result;
  }

  @Post('verify-login-code')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar código de segundo factor (2FA)',
    description: 'Endpoint requerido para admin y gerentes. Valida el código enviado al email y devuelve el token de acceso. Solo se llama después de login si se recibió pendingToken.',
  })
  async verifyLoginCode(@Body() dto: VerifyLoginCodeDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyLoginCode(dto);

    if (result && 'token' in result && typeof result.token === 'string' && result.token) {
      this.setAccessTokenCookie(res, req, result.token);
    }

    return result;
  }

  @Post('verify-email')
  @Public()
  @ApiOperation({ summary: 'Verificar correo con codigo' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @Public()
  @ApiOperation({ summary: 'Reenviar codigo de verificacion' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Post('request-password-reset')
  @Public()
  @ApiOperation({ summary: 'Solicitar codigo de recuperacion' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Resetear contrasena con codigo' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesion (lado cliente)' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.clearCookie('access_token', {
      path: '/',
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
    });
    return this.authService.logout();
  }
}

