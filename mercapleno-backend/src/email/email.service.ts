import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { LowStockAlert } from '../common/stock/low-stock.util';
import { envs } from '../config';
import { PrismaService } from '../prisma/prisma.service';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}

export interface SendMailResult {
  success: boolean;
  provider: 'resend' | 'brevo' | 'smtp' | 'none';
  id?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    const user = envs.smtpUser?.trim();
    const pass = envs.smtpPass?.replace(/\s+/g, '');

    if (!user || !pass) {
      return null;
    }

    const isGmail =
      envs.smtpService?.toLowerCase() === 'gmail' ||
      envs.smtpHost?.includes('gmail') ||
      user.toLowerCase().endsWith('@gmail.com');

    try {
      const options: any = isGmail
        ? {
            service: 'gmail',
            auth: {
              user,
              pass,
            },
            tls: {
              rejectUnauthorized: false,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
          }
        : {
            host: envs.smtpHost || 'smtp.gmail.com',
            port: envs.smtpPort || 587,
            secure: envs.smtpSecure || false,
            auth: {
              user,
              pass,
            },
            tls: {
              rejectUnauthorized: false,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
          };

      this.transporter = nodemailer.createTransport(options);
      return this.transporter;
    } catch (err: any) {
      this.logger.error(`Error al inicializar transporte SMTP: ${err.message}.`);
      return null;
    }
  }

  private fromAddress(): string {
    const from = envs.smtpFromEmail || envs.smtpUser || 'onboarding@resend.dev';
    return envs.appName ? `"${envs.appName}" <${from}>` : from;
  }

  async sendEmail(options: SendMailOptions): Promise<SendMailResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const toStr = recipients.join(', ');

    // 1. Enviar vía RESEND HTTP API (Puerto 443 HTTPS - Nunca bloqueado por Render ni la nube)
    if (envs.resendApiKey) {
      try {
        const from =
          envs.smtpFromEmail && !envs.smtpFromEmail.endsWith('@gmail.com')
            ? (envs.appName ? `"${envs.appName}" <${envs.smtpFromEmail}>` : envs.smtpFromEmail)
            : `${envs.appName || 'Mercapleno'} <onboarding@resend.dev>`;

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${envs.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: recipients,
            subject: options.subject,
            html: options.html,
            text: options.text,
          }),
        });

        const data: any = await response.json().catch(() => ({}));
        if (response.ok && data?.id) {
          this.logger.log(`✓ [Resend HTTP] Correo enviado exitosamente a ${toStr}. ID: ${data.id}`);
          return { success: true, provider: 'resend', id: data.id };
        } else {
          const errMsg = data?.message || response.statusText || 'Error desconocido';
          this.logger.error(`✗ [Resend HTTP] Fallo al enviar correo a ${toStr}: ${errMsg}`);
        }
      } catch (err: any) {
        this.logger.error(`✗ [Resend HTTP] Error de conexion al enviar a ${toStr}: ${err.message}`);
      }
    }

    // 2. Enviar vía BREVO HTTP API (Puerto 443 HTTPS)
    if (envs.brevoApiKey) {
      try {
        const senderEmail = envs.smtpFromEmail || envs.smtpUser || 'notificaciones@mercapleno.com';
        const senderName = envs.appName || 'Mercapleno';

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': envs.brevoApiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: recipients.map((email) => ({ email })),
            subject: options.subject,
            htmlContent: options.html,
            textContent: options.text,
          }),
        });

        const data: any = await response.json().catch(() => ({}));
        if (response.ok && (data?.messageId || data?.id)) {
          const id = data.messageId || data.id;
          this.logger.log(`✓ [Brevo HTTP] Correo enviado exitosamente a ${toStr}. Message ID: ${id}`);
          return { success: true, provider: 'brevo', id };
        } else {
          const errMsg = data?.message || response.statusText || 'Error desconocido';
          this.logger.error(`✗ [Brevo HTTP] Fallo al enviar correo a ${toStr}: ${errMsg}`);
        }
      } catch (err: any) {
        this.logger.error(`✗ [Brevo HTTP] Error de conexion al enviar a ${toStr}: ${err.message}`);
      }
    }

    // 3. Fallback a Nodemailer SMTP
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: this.fromAddress(),
          to: toStr,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        this.logger.log(`✓ [Nodemailer SMTP] Correo enviado exitosamente a ${toStr}. Message ID: ${info.messageId}`);
        return { success: true, provider: 'smtp', id: info.messageId };
      } catch (err: any) {
        this.logger.error(`✗ [Nodemailer SMTP] Fallo al enviar a ${toStr}: ${err.message}`);
        return { success: false, provider: 'smtp', error: err.message };
      }
    }

    if (!envs.resendApiKey && !envs.brevoApiKey) {
      this.logger.warn(`No hay proveedor de correo configurado (RESEND_API_KEY, BREVO_API_KEY o SMTP_USER/PASS) para enviar a ${toStr}.`);
    }

    return { success: false, provider: 'none' };
  }

  async sendVerificationCode(email: string, code: string, ttlMin: number): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `${envs.appName} - Codigo de verificacion`,
      text: `Tu codigo de verificacion es ${code}. Vence en ${ttlMin} minutos.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">${envs.appName}</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Plataforma de Gestion y Supermercado</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Tu codigo de verificacion de cuenta es:</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; background-color: #eff6ff; border: 2px dashed #93c5fd; border-radius: 10px; padding: 14px; display: inline-block; min-width: 220px;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 13px; margin: 16px 0 0 0;">
              Valido durante <strong>${ttlMin} minutos</strong>.
            </p>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
            Si no has solicitado este registro, puedes ignorar este correo con tranquilidad.
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} ${envs.appName}. Todos los derechos reservados.
          </p>
        </div>
      `,
    });
  }

  async sendLoginTwoFactorCode(
    email: string,
    code: string,
    ttlMin: number,
    roleName?: string,
  ): Promise<void> {
    const profileLabel = roleName?.trim() || 'usuario administrativo';
    await this.sendEmail({
      to: email,
      subject: `${envs.appName} - Codigo de acceso seguro (2FA)`,
      text: `Tu codigo de segundo factor para ${profileLabel} es ${code}. Vence en ${ttlMin} minutos.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">${envs.appName}</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Autenticacion de Dos Factores</p>
          </div>
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">
            Detectamos un intento de inicio de sesion para tu cuenta de <strong>${profileLabel}</strong>.
          </p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">TU CODIGO DE SEGUNDO FACTOR</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #15803d; background-color: #ffffff; border: 2px solid #86efac; border-radius: 10px; padding: 14px; display: inline-block; min-width: 220px;">
              ${code}
            </div>
            <p style="color: #166534; font-size: 13px; margin: 14px 0 0 0;">
              Expira en <strong>${ttlMin} minutos</strong> y solo es valido para este acceso.
            </p>
          </div>
          <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #9a3412; font-size: 13px; margin: 0; line-height: 1.4;">
              <strong>Aviso de seguridad:</strong> No compartas este codigo con nadie. El equipo de ${envs.appName} nunca te pedira este codigo.
            </p>
          </div>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} ${envs.appName}. Todos los derechos reservados.
          </p>
        </div>
      `,
    });
  }

  async sendPasswordResetCode(email: string, code: string, ttlMin: number): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `${envs.appName} - Recuperar contrasena`,
      text: `Tu codigo para recuperar contrasena es ${code}. Vence en ${ttlMin} minutos.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">${envs.appName}</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Recuperacion de Contrasena</p>
          </div>
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">
            Recibimos una solicitud para restablecer tu contrasena de acceso a <strong>${envs.appName}</strong>.
          </p>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #991b1b; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">CODIGO DE RESTABLECIMIENTO</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #b91c1c; background-color: #ffffff; border: 2px solid #fca5a5; border-radius: 10px; padding: 14px; display: inline-block; min-width: 220px;">
              ${code}
            </div>
            <p style="color: #991b1b; font-size: 13px; margin: 14px 0 0 0;">
              Valido durante <strong>${ttlMin} minutos</strong>.
            </p>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
            Si no solicitaste el restablecimiento de contrasena, por favor ignora este mensaje o contacta a soporte.
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} ${envs.appName}. Todos los derechos reservados.
          </p>
        </div>
      `,
    });
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

    await this.sendEmail({
      to: recipientEmails,
      subject: `${envs.appName} - Alerta de stock bajo`,
      text: [
        `Se detecto stock bajo tras ${sourceLabel}.`,
        `Fecha: ${timestamp}.`,
        '',
        ...alerts.map((alert, index) => `${index + 1}. ${alert.message}`),
      ].join('\n'),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="margin-bottom: 8px; color: #0f172a;">Alerta de stock bajo</h2>
          <p style="margin: 0 0 8px; color: #334155;">
            Se detecto stock bajo tras <strong>${sourceLabel}</strong>.
          </p>
          <p style="margin: 0 0 16px; color: #64748b; font-size: 13px;">${timestamp}</p>
          <p style="margin: 0 0 16px; color: #334155;">${summary}</p>
          <ul style="padding-left: 18px; margin: 0; color: #334155;">
            ${alerts
              .map(
                (alert) => `
                  <li style="margin-bottom: 10px;">
                    <strong>${alert.productName?.trim() || `Producto ID ${alert.productId}`}</strong><br />
                    ${alert.message}<br />
                    <span style="color: #64748b; font-size: 13px;">Umbral configurado: ${alert.threshold}</span>
                  </li>
                `,
              )
              .join('')}
          </ul>
        </div>
      `,
    });
  }
}

