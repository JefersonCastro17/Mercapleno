import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL?: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ADMIN_ROLE_ID: number;
  SMTP_SERVICE?: string;
  SMTP_HOST?: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM_EMAIL?: string;
  APP_NAME: string;
  EMAIL_VERIFICATION_TTL_MIN: number;
  LOGIN_2FA_TTL_MIN: number;
  PASSWORD_RESET_TTL_MIN: number;
  INTERNAL_API_KEY?: string;
  LOW_STOCK_THRESHOLD: number;
  CORS_ORIGINS?: string;
  NODE_ENV?: string;
}

const schema = joi
  .object({
    PORT: joi.number().default(4000),
    NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
    DATABASE_URL: joi.string().optional().allow(''),
    DB_HOST: joi.string().default('localhost'),
    DB_PORT: joi.number().default(3306),
    DB_USER: joi.string().default('root'),
    DB_PASSWORD: joi.string().allow('').default(''),
    DB_NAME: joi.string().default('mercapleno'),
    JWT_SECRET: joi.string().default('yogui'), //token
    JWT_EXPIRES_IN: joi.string().default('2h'),
    ADMIN_ROLE_ID: joi.number().default(1),
    SMTP_SERVICE: joi.string().optional().allow(''),
    SMTP_HOST: joi.string().optional().allow(''),
    SMTP_PORT: joi.number().default(587),
    SMTP_SECURE: joi.boolean().truthy('true').falsy('false').default(false),
    SMTP_USER: joi.string().optional().allow(''),
    SMTP_PASS: joi.string().optional().allow(''),
    SMTP_FROM_EMAIL: joi.string().optional().allow(''),
    APP_NAME: joi.string().default('Mercapleno'),
    EMAIL_VERIFICATION_TTL_MIN: joi.number().default(15),
    LOGIN_2FA_TTL_MIN: joi.number().integer().min(1).default(10),
    PASSWORD_RESET_TTL_MIN: joi.number().default(15),
    INTERNAL_API_KEY: joi.string().min(10).required(),
    LOW_STOCK_THRESHOLD: joi.number().integer().min(0).default(5),
    CORS_ORIGINS: joi.string().default('http://localhost:3000,http://localhost:5173'),
  })
  .unknown(true);

const { error, value } = schema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars = value as EnvVars;

const buildDatabaseUrl = (): string => {
  if (envVars.DATABASE_URL && envVars.DATABASE_URL.trim().length > 0) {
    return envVars.DATABASE_URL.trim();
  }

  const user = encodeURIComponent(envVars.DB_USER);
  const password = envVars.DB_PASSWORD ? `:${encodeURIComponent(envVars.DB_PASSWORD)}` : '';
  const host = envVars.DB_HOST;
  const port = envVars.DB_PORT;
  const database = envVars.DB_NAME;

  return `mysql://${user}${password}@${host}:${port}/${database}`;
};

export const envs = {
  port: envVars.PORT,
  nodeEnv: envVars.NODE_ENV || 'development',
  databaseUrl: buildDatabaseUrl(),
  dbHost: envVars.DB_HOST,
  dbPort: envVars.DB_PORT,
  dbUser: envVars.DB_USER,
  dbPassword: envVars.DB_PASSWORD,
  dbName: envVars.DB_NAME,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN,
  adminRoleId: envVars.ADMIN_ROLE_ID,
  smtpService: envVars.SMTP_SERVICE?.trim() || undefined,
  smtpHost: envVars.SMTP_HOST?.trim() || undefined,
  smtpPort: envVars.SMTP_PORT,
  smtpSecure: envVars.SMTP_SECURE,
  smtpUser: envVars.SMTP_USER?.trim() || undefined,
  smtpPass: envVars.SMTP_PASS?.trim() || undefined,
  smtpFromEmail: envVars.SMTP_FROM_EMAIL?.trim() || undefined,
  appName: envVars.APP_NAME,
  emailVerificationTtlMin: envVars.EMAIL_VERIFICATION_TTL_MIN,
  loginTwoFactorTtlMin: envVars.LOGIN_2FA_TTL_MIN,
  corsOrigins: envVars.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'],
  passwordResetTtlMin: envVars.PASSWORD_RESET_TTL_MIN,
  internalApiKey: envVars.INTERNAL_API_KEY,
  lowStockThreshold: envVars.LOW_STOCK_THRESHOLD,
};
