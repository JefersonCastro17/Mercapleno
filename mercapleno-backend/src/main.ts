import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { envs } from './config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsRoot = join(process.cwd(), 'uploads');

  mkdirSync(uploadsRoot, { recursive: true });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: envs.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    maxAge: 3600,
  });
  app.useStaticAssets(uploadsRoot, { prefix: '/uploads/' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mercapleno API')
    .setDescription('Documentación de la API de Mercapleno')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addSecurity('x-api-key', {
      type: 'apiKey',
      in: 'header',
      name: 'x-api-key',
      description: 'Clave API para acceso a rutas protegidas',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(envs.port, '0.0.0.0');
  console.log(`Mercapleno backend corriendo en http://localhost:${envs.port}`);
}

bootstrap();
