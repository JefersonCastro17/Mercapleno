import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { LowStockAlert } from '../common/stock/low-stock.util';
import { envs } from '../config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    if (!envs.smtpUser || !envs.smtpPass) {
      this.logger.warn('SMTP no configurado: faltan SMTP_USER/SMTP_PASS. Los codigos de seguridad se mostraran en los logs de la consola.');
      return null;
    }

    if (!envs.smtpService && !envs.smtpHost) {
      this.logger.warn('SMTP no configurado: falta SMTP_HOST o SMTP_SERVICE. Los codigos de seguridad se mostraran en los logs de la consola.');
      return null;
    }

    try {
      const options: any = envs.smtpService
        ? {
            service: envs.smtpService,
            auth: {
              user: envs.smtpUser,
              pass: envs.smtpPass,
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
          }
        : {
            host: envs.smtpHost,
            port: envs.smtpPort,
            secure: envs.smtpSecure,
            auth: {
              user: envs.smtpUser,
              pass: envs.smtpPass,
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
          };

      this.transporter = nodemailer.createTransport(options);
      return this.transporter;
    } catch (err: any) {
      this.logger.error(`Error al inicializar transporte SMTP: ${err.message}. Se usara consola como fallback.`);
      return null;
    }
  }

  private fromAddress(): string {
    const from = envs.smtpFromEmail || envs.smtpUser || 'no-reply@mercapleno.com';
    return envs.appName ? `"${envs.appName}" <${from}>` : from;
  }

  async sendVerificationCode(email: string, code: string, ttlMin: number): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`====================================================`);
      this.logger.warn(`[CODIGO DE VERIFICACION] Para: ${email} | Codigo: ${code} (Vence en ${ttlMin}m)`);
      this.logger.warn(`====================================================`);
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: this.fromAddress(),
        to: email,
        subject: `${envs.appName} - Codigo de verificacion`,
        text: `Tu codigo de verificacion es ${code}. Vence en ${ttlMin} minutos.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>Tu codigo de verificacion es:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 2px;">${code}</div>
            <p>Este codigo vence en ${ttlMin} minutos.</p>
          </div>
        `,
      });
      this.logger.log(`Correo de verificacion enviado a ${email}. Message ID: ${info.messageId}`);
    } catch (err: any) {
      this.logger.error(`Fallo envio SMTP de verificacion a ${email}: ${err.message}`);
      this.logger.warn(`[CODIGO DE VERIFICACION FALLBACK] Para: ${email} | Codigo: ${code}`);
    }
  }

  async sendLoginTwoFactorCode(
    email: string,
    code: string,
    ttlMin: number,
    roleName?: string,
  ): Promise<void> {
    const transporter = this.getTransporter();
    const profileLabel = roleName?.trim() || 'usuario administrativo';

    if (!transporter) {
      this.logger.warn(`====================================================`);
      this.logger.warn(`[CODIGO 2FA LOGIN] Para: ${email} (${profileLabel}) | Codigo: ${code} (Vence en ${ttlMin}m)`);
      this.logger.warn(`====================================================`);
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: this.fromAddress(),
        to: email,
        subject: `${envs.appName} - Codigo de acceso`,
        text: `Tu codigo de segundo factor para ${profileLabel} es ${code}. Vence en ${ttlMin} minutos.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>Recibimos un intento de inicio de sesion para tu cuenta de <strong>${profileLabel}</strong>.</p>
            <p>Tu codigo de segundo factor es:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 2px;">${code}</div>
            <p>Este codigo vence en ${ttlMin} minutos y solo sirve para completar este inicio de sesion.</p>
          </div>
        `,
      });
      this.logger.log(`Correo de segundo factor enviado a ${email}. Message ID: ${info.messageId}`);
    } catch (err: any) {
      this.logger.error(`Fallo envio SMTP de 2FA a ${email}: ${err.message}`);
      this.logger.warn(`====================================================`);
      this.logger.warn(`[CODIGO 2FA FALLBACK] Para: ${email} (${profileLabel}) | Codigo: ${code}`);
      this.logger.warn(`====================================================`);
    }
  }

  async sendPasswordResetCode(email: string, code: string, ttlMin: number): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`====================================================`);
      this.logger.warn(`[CODIGO RECUPERAR CLAVE] Para: ${email} | Codigo: ${code} (Vence en ${ttlMin}m)`);
      this.logger.warn(`====================================================`);
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: this.fromAddress(),
        to: email,
        subject: `${envs.appName} - Recuperar contrasena`,
        text: `Tu codigo para recuperar contrasena es ${code}. Vence en ${ttlMin} minutos.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>Tu codigo para recuperar contrasena es:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 2px;">${code}</div>
            <p>Este codigo vence en ${ttlMin} minutos.</p>
          </div>
        `,
      });
      this.logger.log(`Correo de recuperacion enviado a ${email}. Message ID: ${info.messageId}`);
    } catch (err: any) {
      this.logger.error(`Fallo envio SMTP de recuperacion a ${email}: ${err.message}`);
      this.logger.warn(`[CODIGO RECUPERAR CLAVE FALLBACK] Para: ${email} | Codigo: ${code}`);
    }
  }

  async sendLowStockAlertToAdmins(alerts: LowStockAlert[], source: string): Promise<void> {
    if (!alerts.length) {
      return;
    }

    const admins = await this.prisma.usuarios.findMany({
      where: { id_rol: 1 },
      select: { email: true },
    });

    const recipientEmails = Array.from(
      new Set(
        admins
          .map((admin) => admin.email?.trim().toLowerCase())
          .filter((email): email is string => Boolean(email)),
      ),
    );

    if (!recipientEmails.length) {
      this.logger.warn('No hay administradores con correo disponible para alerta de stock bajo');
      return;
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`[ALERTA STOCK BAJO (Consola)]: ${alerts.map(a => a.message).join(' | ')}`);
      return;
    }

    const timestamp = new Date().toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const sourceLabel = source.trim() || 'operacion del sistema';
    const summary =
      alerts.length === 1
        ? alerts[0].message
        : `${alerts.length} productos quedaron con stock bajo.`;

    try {
      const info = await transporter.sendMail({
        from: this.fromAddress(),
        to: recipientEmails.join(','),
        subject: `${envs.appName} - Alerta de stock bajo`,
        text: [
          `Se detecto stock bajo tras ${sourceLabel}.`,
          `Fecha: ${timestamp}.`,
          '',
          ...alerts.map((alert, index) => `${index + 1}. ${alert.message}`),
        ].join('\n'),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="margin-bottom: 8px;">Alerta de stock bajo</h2>
            <p style="margin: 0 0 8px;">
              Se detecto stock bajo tras <strong>${sourceLabel}</strong>.
            </p>
            <p style="margin: 0 0 16px; color: #64748b;">${timestamp}</p>
            <p style="margin: 0 0 16px;">${summary}</p>
            <ul style="padding-left: 18px; margin: 0;">
              ${alerts
                .map(
                  (alert) => `
                    <li style="margin-bottom: 10px;">
                      <strong>${alert.productName?.trim() || `Producto ID ${alert.productId}`}</strong><br />
                      ${alert.message}<br />
                      Umbral configurado: ${alert.threshold}
                    </li>
                  `,
                )
                .join('')}
            </ul>
          </div>
        `,
      });

      this.logger.log(
        `Alerta de stock bajo enviada a ${recipientEmails.join(', ')} para ${alerts.length} producto(s). Message ID: ${info.messageId}`,
      );
    } catch (err: any) {
      this.logger.error(`Fallo envio SMTP de alerta de stock bajo: ${err.message}`);
    }
  }
}
