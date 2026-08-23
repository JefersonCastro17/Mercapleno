# Mercapleno Backend (NestJS)

Backend migrado desde Express a **NestJS**, conservando:
- Envio de correos de verificacion y recuperacion por **Nodemailer**.
- Documentacion **Swagger**.
- Rutas funcionales equivalentes para auth, usuarios admin, productos, inventario, ventas y reportes.
- Integracion de **Prisma ORM** sobre MySQL.

## 1) Estado de la migracion

La migracion se hizo sobre esta carpeta:
- `C:\Users\jefer\OneDrive\Escritorio\mercaplen_final_version\mercapleno-backend`

El backend activo ahora es el de `src/` (NestJS + TypeScript).

## 2) Arquitectura final

```text
src/
  main.ts
  app.module.ts
  config/
    envs.ts
    index.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  common/database/
    mysql.module.ts
    mysql.service.ts
  auth/
  email/
  users-admin/
  products/
  inventory/
  sales/
  reports/
```

## 3) Como ejecutar

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
- Usa `.env.example` como base.
- Puedes mantener tu `.env` actual para SMTP.
- Si no defines DB/JWT, el sistema usa defaults compatibles con tu backend anterior:
  - `DATABASE_URL=mysql://root:@localhost:3306/mercapleno`
  - `DB_HOST=localhost`
  - `DB_PORT=3306`
  - `DB_USER=root`
  - `DB_PASSWORD=`
  - `DB_NAME=mercapleno`
  - `JWT_SECRET=yogui`

3. Levantar en desarrollo:
```bash
npm run start:dev
```

4. Swagger:
- `http://localhost:4000/api/docs`

5. Compilar:
```bash
npm run build
```

## 4) Variables de entorno

Archivo ejemplo: `.env.example`

- `PORT`: puerto HTTP (default 4000)
- `DATABASE_URL`: URL principal para Prisma (si no existe, se construye desde DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: conexion MySQL
- `JWT_SECRET`, `JWT_EXPIRES_IN`: firma y expiracion JWT
- `ADMIN_ROLE_ID`: reservado para reglas de rol futuras (default 1)
- `SMTP_SERVICE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`: correo
- `APP_NAME`: nombre para el remitente de correo
- `EMAIL_VERIFICATION_TTL_MIN`: minutos de vigencia para codigo de verificacion
- `PASSWORD_RESET_TTL_MIN`: minutos de vigencia para codigo de recuperacion

## 5) Rutas migradas

### Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `POST /verify-email`
- `POST /resend-verification`
- `POST /request-password-reset`
- `POST /reset-password`
- `POST /logout`

### Admin users (`/api/admin/users`)
- `GET /`
- `POST /`
- `PATCH /:id`
- `DELETE /:id`

### Productos (`/api/productos`)
- `GET /`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### Movimientos (`/api/movimientos`)
- `GET /productos`
- `POST /registrar`

### Ventas (`/api/sales`)
- `GET /products`
- `GET /categories`
- `POST /orders`

### Reportes (`/api/sales/reports`)
- `GET /ventas-mes`
- `GET /top-productos`
- `GET /resumen`
- `GET /resumen-mes`
- `GET /pdf-resumen`

## 6) Seguridad y auth

- Se aplica guard JWT global en `AppModule`.
- Rutas publicas se marcan con `@Public()`.
- Token JWT se emite en login con payload:
  - `sub` (id usuario)
  - `id_rol`
  - `email`
- Guarda compatibilidad con el flujo anterior de frontend (Bearer token).

## 7) Correo (Nodemailer)

Servicio principal:
- `src/email/email.service.ts`

Funciones clave:
- `sendVerificationCode(email, code, ttlMin)`
- `sendPasswordResetCode(email, code, ttlMin)`

Se mantiene el mismo comportamiento funcional:
- Registro crea codigo de verificacion y trata de enviarlo por correo.
- Recuperacion genera codigo temporal y lo envia por correo.

## 8) Swagger

Configuracion en:
- `src/main.ts`

Se usa `DocumentBuilder` + `SwaggerModule.setup('api/docs', ...)`.

## 9) Flujo principal por modulo

### Auth
1. Registro: hash de password + codigo de verificacion (hash SHA-256 en BD).
2. Verificacion: compara hash y expiracion.
3. Login: valida password + `email_verified`.
4. Recuperacion: genera codigo temporal, valida expiracion y actualiza password hasheada.
5. Implementado con Prisma (`usuarios`, `roles`, `tipos_identificacion`).

### Sales
1. Consulta catalogo con filtros dinamicos.
2. Crea orden dentro de transaccion SQL.
3. Bloquea stock (`FOR UPDATE`) y valida disponibilidad.
4. Inserta venta + detalle + salida de inventario.
5. Descuenta stock y confirma transaccion.
6. Este modulo permanece en SQL por complejidad transaccional y bloqueo de filas.

### Reports
- Consultas SQL agregadas para KPIs.
- Generacion de PDF con `pdfkit`.

## 10) Descripcion archivo por archivo

### Core
- `src/main.ts`: bootstrap de Nest, CORS, ValidationPipe, prefijo `/api`, Swagger.
- `src/app.module.ts`: modulo raiz; registra modulos y guard JWT global.

### Config
- `src/config/envs.ts`: carga y valida variables de entorno con Joi; exporta `envs`.
- `src/config/index.ts`: reexport de config.

### DB
- `src/common/database/mysql.module.ts`: modulo global de base de datos.
- `src/common/database/mysql.service.ts`: pool MySQL, helper `query()`, manejo de conexiones y cierre.

### Prisma
- `prisma/schema.prisma`: esquema introspectado desde tu base MySQL `mercapleno`.
- `src/prisma/prisma.module.ts`: expone Prisma globalmente.
- `src/prisma/prisma.service.ts`: PrismaClient compartido por los modulos.

### Auth
- `src/auth/auth.module.ts`: integra Passport/JWT y declara controller + service.
- `src/auth/auth.controller.ts`: endpoints HTTP de autenticacion.
- `src/auth/auth.service.ts`: logica completa de registro/login/verificacion/recuperacion usando Prisma.
- `src/auth/strategies/jwt.strategy.ts`: estrategia de Passport para validar token.
- `src/auth/guards/jwt-auth.guard.ts`: guard global que respeta rutas `@Public()`.
- `src/auth/decorators/public.decorator.ts`: marca endpoints sin auth.
- `src/auth/decorators/current-user.decorator.ts`: extrae usuario autenticado desde request.
- `src/auth/interfaces/auth-user.interface.ts`: tipado del usuario autenticado.
- `src/auth/dto/login.dto.ts`: contrato de entrada para login.
- `src/auth/dto/register.dto.ts`: contrato de entrada para registro.
- `src/auth/dto/verify-email.dto.ts`: contrato para verificar codigo email.
- `src/auth/dto/resend-verification.dto.ts`: contrato para reenviar codigo.
- `src/auth/dto/request-password-reset.dto.ts`: contrato para solicitar recuperacion.
- `src/auth/dto/reset-password.dto.ts`: contrato para reset de password.

### Email
- `src/email/email.module.ts`: modulo global de correo.
- `src/email/email.service.ts`: transporter de Nodemailer + plantillas de correo.

### Users admin
- `src/users-admin/users-admin.module.ts`: modulo de gestion admin de usuarios.
- `src/users-admin/users-admin.controller.ts`: endpoints CRUD administrativos.
- `src/users-admin/users-admin.service.ts`: CRUD administrativo usando Prisma.
- `src/users-admin/dto/create-user-admin.dto.ts`: payload para crear usuario admin.
- `src/users-admin/dto/update-user-admin.dto.ts`: payload para actualizar usuario admin.

### Products
- `src/products/products.module.ts`: modulo de productos.
- `src/products/products.controller.ts`: endpoints CRUD de productos.
- `src/products/products.service.ts`: CRUD de `productos` usando Prisma.
- `src/products/dto/create-product.dto.ts`: payload de creacion.
- `src/products/dto/update-product.dto.ts`: payload de actualizacion parcial.

### Inventory
- `src/inventory/inventory.module.ts`: modulo de movimientos.
- `src/inventory/inventory.controller.ts`: endpoints de inventario.
- `src/inventory/inventory.service.ts`: consulta de stock + registro transaccional de entrada/salida.
- `src/inventory/dto/register-movement.dto.ts`: payload de movimiento.

### Sales
- `src/sales/sales.module.ts`: modulo de ventas.
- `src/sales/sales.controller.ts`: catalogo, categorias y checkout.
- `src/sales/sales.service.ts`: filtros, categorias y orden transaccional con validacion de stock.
- `src/sales/dto/order-item.dto.ts`: item de orden.
- `src/sales/dto/create-order.dto.ts`: payload completo de orden.

### Reports
- `src/reports/reports.module.ts`: modulo de reportes.
- `src/reports/reports.controller.ts`: endpoints de reportes JSON/PDF.
- `src/reports/reports.service.ts`: SQL agregadas + construccion PDF.

## 11) Notas de compatibilidad

- Se conservaron las rutas publicas/protegidas del flujo actual del frontend.
- Se conserva envio de correo con el mismo objetivo funcional (verificacion y recuperacion).
- Se conserva documentacion Swagger, ahora nativa de Nest en `/api/docs`.
- Estado de datos: `auth`, `users-admin` y `products` ya usan Prisma; `inventory`, `sales` y `reports` siguen en SQL (mysql2) por transacciones y reportes avanzados.

## 12) Scripts disponibles

- `npm run start`: iniciar Nest en modo normal.
- `npm run start:dev`: iniciar con watch.
- `npm run build`: compilar TypeScript a `dist/`.
- `npm run start:prod`: ejecutar compilado.
- `npm run prisma:pull`: refrescar `prisma/schema.prisma` desde la base real.
- `npm run prisma:generate`: regenerar cliente Prisma.
- `npm run prisma:studio`: abrir interfaz visual de Prisma.

