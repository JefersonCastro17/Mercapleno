# Informe de avance: integracion real Sales y Cart

## Control del documento

- Plan relacionado: [plan-integracion-real-sales-cart.md](./plan-integracion-real-sales-cart.md)
- Base objetivo: `mercapleno_testv1`
- Alcance: migrar los 30 casos de la suite simulada a la aplicacion Nest y MySQL reales.
- Fecha de inicio: 2026-08-25
- Estado general: EN PREPARACION

## Regla de actualizacion

Cada punto debe actualizarse con:

- Estado: `PENDIENTE`, `EN PROGRESO`, `COMPLETADO` o `BLOQUEADO`.
- Fecha y responsable de la ejecucion.
- Comando o accion realizada.
- Resultado observable.
- Evidencia, error o pendiente siguiente.

No se debe marcar un punto como completado solo porque el archivo o comando exista. Debe haber una comprobacion ejecutable.

---

## Punto 1. Configuracion del entorno de pruebas

**Estado:** COMPLETADO PARCIALMENTE

### Objetivo

Aislar la ejecucion de integracion del entorno de desarrollo y produccion usando variables que apunten exclusivamente a `mercapleno_testv1`.

### Archivos que se deben preparar

Crear `mercapleno-backend/.env.test` fuera del control de versiones. Usar valores reales del servidor MySQL local o Docker, sustituyendo las credenciales de ejemplo:

```env
NODE_ENV=test
PORT=4400
APP_NAME=MercaplenoTest
DATABASE_URL=mysql://test_user:test_password@127.0.0.1:3307/mercapleno_testv1
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=mercapleno_testv1
JWT_SECRET=mercapleno-test-secret-v1
JWT_EXPIRES_IN=1h
INTERNAL_API_KEY=mercapleno-test-api-key-v1
SMTP_SERVICE=log
SMTP_HOST=127.0.0.1
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=test@example.test
SMTP_PASS=test-only
SMTP_FROM_EMAIL=test@example.test
EMAIL_VERIFICATION_TTL_MIN=15
PASSWORD_RESET_TTL_MIN=15
LOW_STOCK_THRESHOLD=5
CORS_ORIGINS=http://localhost:5173
```

### Protecciones obligatorias

- Agregar `.env.test` a `.gitignore` si aún no está excluido.
- Comprobar antes de cada ejecución que `DB_NAME` sea exactamente `mercapleno_testv1`.
- No reutilizar la base `mercapleno`, cualquier base de desarrollo ni una base de producción.
- No almacenar credenciales reales en este informe ni en el repositorio.
- Usar un usuario MySQL con permisos restringidos a `mercapleno_testv1`.
- Configurar el cargador de entorno de Jest antes de importar `AppModule`.

### Verificacion de entorno

Desde `mercapleno-backend`:

```powershell
$env:NODE_ENV = 'test'
$env:DATABASE_URL = 'mysql://test_user:test_password@127.0.0.1:3306/mercapleno_testv1'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3306'
$env:DB_USER = 'test_user'
$env:DB_PASSWORD = 'test_password'
$env:DB_NAME = 'mercapleno_testv1'

node -e "console.log({NODE_ENV: process.env.NODE_ENV, DB_NAME: process.env.DB_NAME, DATABASE_URL: process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')})"
```

**Resultado esperado:** `NODE_ENV` es `test`, `DB_NAME` es `mercapleno_testv1` y la URL no apunta a otra base.

### Evidencia registrada

- Salida del comando anterior.
- Confirmacion de que MySQL responde en `DB_HOST:DB_PORT`.
- Confirmacion de que el usuario de pruebas tiene permisos sobre la base objetivo.
- Docker esta disponible y el servicio `db` esta saludable.
- La migracion se ejecuto con `DB_NAME=mercapleno_testv1`.
- El archivo `mercapleno-backend/.env.test` fue creado con la misma estructura de `.env.docker`, pero apuntando a `mercapleno_testv1`.
- `.env.test` queda excluido por `mercapleno-backend/.gitignore` mediante la regla `.env.*`.
- Pendiente: configurar Jest/arranque del backend para cargar `.env.test` antes de importar `AppModule`.

---

## Punto 2. Creacion de la base MySQL `mercapleno_testv1`

**Estado:** COMPLETADO

### Objetivo

Crear una base limpia y separada para aplicar la estructura actual del sistema.

### Creacion inicial

Ejecutar con una cuenta administrativa de MySQL, no desde una prueba automatizada:

```sql
CREATE DATABASE `mercapleno_testv1`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Crear un usuario dedicado si todavía no existe:

```sql
CREATE USER 'test_user'@'%' IDENTIFIED BY 'test_password';
GRANT ALL PRIVILEGES ON `mercapleno_testv1`.* TO 'test_user'@'%';
FLUSH PRIVILEGES;
```

En un entorno local se puede restringir el host a `'localhost'` o `'127.0.0.1'` según la configuración de MySQL.

### Comprobacion de aislamiento

```sql
SELECT DATABASE();
SHOW DATABASES LIKE 'mercapleno_testv1';
SELECT User, Host FROM mysql.user WHERE User = 'test_user';
```

**Resultado obtenido:** `mercapleno_testv1` fue creada dentro del contenedor `mercapleno-docker-db-1`. La base `mercapleno` existente no fue modificada.

Comando ejecutado:

```powershell
docker exec mercapleno-docker-db-1 mariadb -uroot -proot123 -e "CREATE DATABASE IF NOT EXISTS mercapleno_testv1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; SHOW DATABASES LIKE 'mercapleno_testv1';"
```

Resultado: `mercapleno_testv1` existe y estaba inicialmente vacia.

Verificacion posterior: la base contiene 19 tablas y la tabla `_prisma_migrations` registra 4 migraciones aplicadas.

### Reinicializacion segura de la base

Solo si `DB_NAME` fue verificado como `mercapleno_testv1`:

```sql
DROP DATABASE IF EXISTS `mercapleno_testv1`;
CREATE DATABASE `mercapleno_testv1`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Nunca ejecutar este bloque contra una base cuyo nombre no sea exactamente `mercapleno_testv1`.

---

## Punto 3. Aplicacion de las tablas reales mediante Prisma

**Estado:** COMPLETADO

La estructura debe construirse aplicando todas las migraciones existentes, en orden cronologico:

1. `20260407044919_init`
2. `20260407051927_add_two_factor_fields`
3. `20260628000000_add_producto_estado_deshabilitado`
4. `20260811173000_add_cart`

La migracion inicial crea las tablas principales, entre ellas `categoria`, `productos`, `stock_actual`, `usuarios`, `venta`, `venta_productos`, `movimiento`, `salida_productos`, `roles`, `metodo` y tablas auxiliares.

Las migraciones posteriores agregan:

- Campos `login_two_factor_code` y `login_two_factor_expires` en `usuarios`.
- La variante `Deshabilitado` al enum `productos.estado`.
- Las tablas `cart` y `cart_items`, con la relacion `cart_items.cart_id -> cart.id` en cascada.

Desde el contenedor backend se ejecuto con el host interno `db` y la base explicitamente seleccionada:

```powershell
docker exec -e DATABASE_URL='mysql://root:root123@db:3306/mercapleno_testv1' -e DB_HOST='db' -e DB_PORT='3306' -e DB_USER='root' -e DB_PASSWORD='root123' -e DB_NAME='mercapleno_testv1' mercapleno-docker-backend-1 npx prisma migrate deploy --schema prisma/schema.prisma
```

Resultado: Prisma encontro y aplico correctamente las cuatro migraciones listadas en este documento.

Si el proyecto requiere generar el cliente:

```powershell
npx prisma generate --schema .\prisma\schema.prisma
```

### Verificaciones SQL de estructura

```sql
USE `mercapleno_testv1`;
SHOW TABLES;
DESCRIBE `productos`;
DESCRIBE `usuarios`;
DESCRIBE `venta`;
DESCRIBE `venta_productos`;
DESCRIBE `stock_actual`;
DESCRIBE `cart`;
DESCRIBE `cart_items`;
```

**Resultado obtenido:** las tablas existen con las columnas y relaciones definidas por `schema.prisma` y las migraciones; esto incluye `cart` y `cart_items`.

---

## Punto 4. Datos base y fixtures aislados

**Estado:** COMPLETADO INICIALMENTE

Crear datos mínimos necesarios para los 30 casos, guardando los IDs generados:

- Rol cliente.
- Tipo de identificación.
- Método de pago `M1`, `M2` y `M3`.
- Tipo de movimiento usado por ventas.
- Una categoría de prueba.
- Productos de prueba con precios, estados y stock conocidos.
- Un usuario cliente por caso o por fixture aislado.

Usar un prefijo único, por ejemplo `it-<timestamp>-<pid>`, en emails, números de identificación, nombres de productos y descripciones. No depender de IDs fijos del entorno de desarrollo.

---

## Punto 5. Aplicacion Nest real

**Estado:** COMPLETADO INICIALMENTE

Crear el bootstrap de pruebas con `Test.createTestingModule({ imports: [AppModule] })`, `createNestApplication()`, prefijo `api` y `ValidationPipe`. No importar `main.ts` porque ejecuta `app.listen()`.

No reemplazar `MysqlService` por `useValue`, `jest.fn()` ni otro mock en las pruebas reales.

---

## Punto 6. Separacion de los 30 casos

**Estado:** COMPLETADO

Crear:

- `sales-service.real.integration.spec.ts`: CP-071 a CP-080 y CP-095 a CP-103.
- `cart-service.real.integration.spec.ts`: CP-081 a CP-094.

Conservar los IDs, pero adaptar los casos al contrato real. En particular, el catálogo real está marcado como público, y `CartService` no valida actualmente todas las restricciones que simulaba la suite original.

---

## Punto 7. Limpieza y restauracion

**Estado:** COMPLETADO INICIALMENTE

En `afterEach`, eliminar solo los registros creados por el caso y respetar este orden: `cart_items`, `cart`, `venta_productos`, `salida_productos`, referencias de `stock_actual`, `movimiento`, `venta`, `usuarios`, `productos` y categorías de prueba.

Restaurar el stock original o crear productos nuevos por caso. En `afterAll`, cerrar la aplicación Nest y el pool de MySQL.

La limpieza debe ejecutarse también cuando una prueba falle. Debe haber una comprobacion SQL que confirme que no quedan registros identificados con el `runId`.

---

## Punto 8. Ejecucion y evidencia de los 30 casos

**Estado:** COMPLETADO

Ejecutar por separado:

```powershell
npx jest integracion/sales/sales-service.real.integration.spec.ts --runInBand --coverage
npx jest integracion/sales/cart-service.real.integration.spec.ts --runInBand --coverage
```

Después ejecutar ambas suites y registrar:

- Total de suites.
- Total de pruebas.
- CP aprobados y fallidos.
- Errores de conexión o de contrato.
- Resultado de la limpieza.
- Conteos finales de registros de prueba en la base.

**Criterio:** 30 pruebas ejecutadas contra la aplicación y la base reales, con limpieza confirmada.

Resultado obtenido el 2026-08-25:

```text
Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
```

La comprobacion posterior en `mercapleno_testv1` encontro cero productos, categorias, usuarios y ventas de fixture. Las 19 tablas permanecen creadas.

---

## Registro de ejecuciones

| Fecha | Punto | Comando/accion | Resultado | Evidencia |
|---|---|---|---|---|
| 2026-08-25 | Documento creado | Creacion del plan y esta bitacora | COMPLETADO | `.vscode/plan/` |
| 2026-08-25 | Suite simulada previa | `npx jest integracion/sales/sales.integration.test.js --runInBand --verbose` | 30 aprobadas; usa arreglos en memoria | Salida de Jest registrada en la sesion |
| 2026-08-25 | Entorno Docker/MariaDB | `docker compose ps` y `docker version` | COMPLETADO PARCIALMENTE | `db` saludable; `.env.test` creado y excluido por Git |
| 2026-08-25 | Creacion de `mercapleno_testv1` | `docker exec ... mariadb ... CREATE DATABASE` | COMPLETADO | Base creada y verificada en `mercapleno-docker-db-1` |
| 2026-08-25 | Migraciones reales | `docker exec ... npx prisma migrate deploy --schema prisma/schema.prisma` | COMPLETADO | 4 migraciones y 19 tablas aplicadas |
| 2026-08-25 | Conexion del backend activo | `docker inspect mercapleno-docker-backend-1` | PENDIENTE DE CAMBIO | El backend activo sigue usando `DB_NAME=mercapleno` |
| 2026-08-25 | Configuracion Jest real | `npm run test:integration:real -- --passWithNoTests` | COMPLETADO | Carga protegida de `.env.test`; sin pruebas funcionales aun |
| 2026-08-25 | Infraestructura real | `npm run test:integration:real -- --runTestsByPath tester/integracion/real-connection.real.integration.spec.ts --verbose` | COMPLETADO | 1 prueba aprobada; AppModule, endpoint real, fixture y limpieza |
| 2026-08-25 | Migracion Sales | `npm run test:integration:real -- --runTestsByPath tester/integracion/sales/sales-service.real.integration.spec.ts --verbose` | COMPLETADO | 17 pruebas aprobadas contra SalesService real |
| 2026-08-25 | Migracion Cart | `npm run test:integration:real -- --runTestsByPath tester/integracion/sales/cart-service.real.integration.spec.ts --verbose` | COMPLETADO | 13 pruebas aprobadas contra CartService real |
| 2026-08-25 | Ejecucion conjunta | `npm run test:integration:real -- --runTestsByPath ...sales... ...cart... --verbose` | COMPLETADO | 30 pruebas aprobadas; limpieza verificada en SQL |

## Cierre del informe

El proyecto solo podrá considerarse migrado cuando los puntos 1 a 8 estén `COMPLETADOS`, las 30 pruebas se ejecuten contra `mercapleno_testv1`, y una consulta final confirme que la limpieza no dejó datos de prueba.
