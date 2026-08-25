import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { EmailService } from '../../../src/email/email.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { envs } from '../../../src/config';
import { LowStockAlert } from '../../../src/common/stock/low-stock.util';

describe('EmailService (Unitarias)', () => {
  let service: EmailService;
  let prismaService: PrismaService;
  let mockSendMail: jest.Mock;

  const mockPrismaService = {
    usuarios: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id-123' });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // =========================================================================
  // 1. CONFIGURACIÓN DEL TRANSPORTER Y DIRECCIÓN REMITENTE
  // =========================================================================
  describe('Configuración del Transporter y Remitente', () => {
    it('debe lanzar error si faltan las credenciales SMTP_USER o SMTP_PASS', () => {
      const originalUser = envs.smtpUser;
      (envs as any).smtpUser = '';

      expect(() => (service as any).getTransporter()).toThrow(
        'SMTP no configurado: faltan SMTP_USER/SMTP_PASS',
      );

      (envs as any).smtpUser = originalUser;
    });

    it('debe lanzar error si no hay SMTP_SERVICE ni SMTP_HOST configurados', () => {
      const originalService = envs.smtpService;
      const originalHost = envs.smtpHost;

      (envs as any).smtpService = '';
      (envs as any).smtpHost = '';

      expect(() => (service as any).getTransporter()).toThrow(
        'SMTP no configurado: falta SMTP_HOST o SMTP_SERVICE',
      );

      (envs as any).smtpService = originalService;
      (envs as any).smtpHost = originalHost;
    });

    it('debe crear el transporter usando smtpHost cuando no hay smtpService', () => {
      const originalService = envs.smtpService;
      const originalHost = envs.smtpHost;

      (envs as any).smtpService = '';
      (envs as any).smtpHost = 'smtp.testmail.com';

      const transporter = (service as any).getTransporter();
      expect(transporter).toBeDefined();
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ host: 'smtp.testmail.com' }),
      );

      (envs as any).smtpService = originalService;
      (envs as any).smtpHost = originalHost;
    });

    it('debe retornar el transporter en caché si ya fue inicializado', () => {
      const mockCached = { sendMail: jest.fn() };
      (service as any).transporter = mockCached;

      const result = (service as any).getTransporter();
      expect(result).toBe(mockCached);
    });

    it('debe lanzar error en fromAddress si falta el correo del remitente', () => {
      const originalFrom = envs.smtpFromEmail;
      const originalUser = envs.smtpUser;

      (envs as any).smtpFromEmail = '';
      (envs as any).smtpUser = '';

      expect(() => (service as any).fromAddress()).toThrow(
        'SMTP no configurado: falta SMTP_FROM_EMAIL',
      );

      (envs as any).smtpFromEmail = originalFrom;
      (envs as any).smtpUser = originalUser;
    });

    it('debe formatear fromAddress con solo el correo si appName está vacío', () => {
      const originalAppName = envs.appName;
      (envs as any).appName = '';

      const from = (service as any).fromAddress();
      expect(from).toBe(envs.smtpFromEmail || envs.smtpUser);

      (envs as any).appName = originalAppName;
    });
  });

  // =========================================================================
  // 2. ENVÍO DE CÓDIGO DE VERIFICACIÓN
  // =========================================================================
  describe('sendVerificationCode', () => {
    it('debe enviar el correo de verificación con el código y tiempo de expiración', async () => {
      await service.sendVerificationCode('cliente@test.com', '123456', 15);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'cliente@test.com',
          subject: expect.stringContaining('Codigo de verificacion'),
          text: expect.stringContaining('123456'),
          html: expect.stringContaining('123456'),
        }),
      );
    });
  });

  // =========================================================================
  // 3. ENVÍO DE CÓDIGO 2FA (DOBLE FACTOR)
  // =========================================================================
  describe('sendLoginTwoFactorCode', () => {
    it('debe enviar el código 2FA con el nombre de rol especificado', async () => {
      await service.sendLoginTwoFactorCode('admin@test.com', '654321', 10, 'Administrador');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@test.com',
          subject: expect.stringContaining('Codigo de acceso'),
          text: expect.stringContaining('Administrador'),
          html: expect.stringContaining('654321'),
        }),
      );
    });

    it('debe usar el perfil por defecto si no se envía roleName', async () => {
      await service.sendLoginTwoFactorCode('empleado@test.com', '654321', 10);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'empleado@test.com',
          text: expect.stringContaining('usuario administrativo'),
        }),
      );
    });
  });

  // =========================================================================
  // 4. ENVÍO DE CÓDIGO DE RECUPERACIÓN DE CONTRASEÑA
  // =========================================================================
  describe('sendPasswordResetCode', () => {
    it('debe enviar el correo de recuperación de contraseña', async () => {
      await service.sendPasswordResetCode('usuario@test.com', '987654', 20);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'usuario@test.com',
          subject: expect.stringContaining('Recuperar contrasena'),
          text: expect.stringContaining('987654'),
          html: expect.stringContaining('987654'),
        }),
      );
    });
  });

  // =========================================================================
  // 5. ENVÍO DE ALERTA DE STOCK BAJO A ADMINISTRADORES
  // =========================================================================
  describe('sendLowStockAlertToAdmins', () => {
    const mockAlerts: LowStockAlert[] = [
      {
        productId: 1,
        productName: 'Leche Deslactosada',
        remainingStock: 3,
        threshold: 5,
        message: 'Stock bajo para Leche Deslactosada (ID 1): quedan 3 unidades.',
      },
      {
        productId: 2,
        productName: '',
        remainingStock: 1,
        threshold: 5,
        message: 'Stock bajo para producto ID 2: quedan 1 unidades.',
      },
    ];

    it('no debe realizar ninguna acción si el arreglo de alertas está vacío', async () => {
      await service.sendLowStockAlertToAdmins([], 'Venta');

      expect(mockPrismaService.usuarios.findMany).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('no debe enviar correo si no existen administradores con email disponible', async () => {
      mockPrismaService.usuarios.findMany.mockResolvedValue([
        { email: null },
        { email: '   ' },
      ]);

      await service.sendLowStockAlertToAdmins(mockAlerts, 'Registro de Compra');

      expect(mockPrismaService.usuarios.findMany).toHaveBeenCalledWith({
        where: { id_rol: 1 },
        select: { email: true },
      });
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('debe enviar alerta para un único producto con su resumen correspondiente', async () => {
      mockPrismaService.usuarios.findMany.mockResolvedValue([
        { email: 'admin1@mercapleno.local' },
        { email: 'admin2@mercapleno.local' },
      ]);

      const singleAlert = [mockAlerts[0]];
      await service.sendLowStockAlertToAdmins(singleAlert, 'Venta #105');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin1@mercapleno.local,admin2@mercapleno.local',
          subject: expect.stringContaining('Alerta de stock bajo'),
          text: expect.stringContaining('Venta #105'),
          html: expect.stringContaining('Leche Deslactosada'),
        }),
      );
    });

    it('debe enviar alerta para múltiples productos usando fuente por defecto', async () => {
      mockPrismaService.usuarios.findMany.mockResolvedValue([
        { email: 'admin@mercapleno.local' },
      ]);

      await service.sendLowStockAlertToAdmins(mockAlerts, '   ');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@mercapleno.local',
          text: expect.stringContaining('operacion del sistema'),
          html: expect.stringContaining('2 productos quedaron con stock bajo'),
        }),
      );
    });
  });
});
