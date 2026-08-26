# Paso a paso de la construccion de la logica real de ventas

## 1. Punto de partida

La suite original `mercapleno-backend/tester/integracion/sales/sales.integration.test.js` simulaba toda la API con Express y tres arreglos en memoria:

- `productsDb` simulaba productos y stock.
- `cartDb` simulaba el carrito.
- `salesDb` simulaba ventas.

Aunque usaba `supertest`, no ejecutaba `AppModule`, `SalesController`, `SalesService`, `CartController`, `CartService` ni `MysqlService`. Por ese motivo las pruebas no verificaban SQL, claves foráneas, persistencia, transacciones ni conexión con MariaDB.

El objetivo de la migracion fue mantener los 30 identificadores de prueba, pero reemplazar la API artesanal por la aplicacion Nest y la base de datos reales.

## 2. Preparacion de la base real

Se identifico el servicio `db` de `mercapleno-docker/docker-compose.yml`:

- Motor: MariaDB compatible con MySQL.
- Nombre del servicio en Docker: `db`.
- Puerto interno: `3306`.
- Puerto publicado al host: `3307`.
- Base original: `mercapleno`.

Para no tocar datos de desarrollo se creo la base aislada:

```sql
CREATE DATABASE mercapleno_testv1
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

La base se creo dentro del contenedor MariaDB activo `mercapleno-docker-db-1`. La aplicacion de las migraciones se realizo desde el contenedor backend usando `db:3306`, que es el host correcto dentro de la red Docker.

## 3. Aplicacion del esquema Prisma

Se aplicaron las cuatro migraciones existentes, en orden cronologico:

1. `20260407044919_init`
2. `20260407051927_add_two_factor_fields`
3. `20260628000000_add_producto_estado_deshabilitado`
4. `20260811173000_add_cart`

El comando ejecutado fue equivalente a:

```powershell
docker exec -e DATABASE_URL='mysql://root:root123@db:3306/mercapleno_testv1' `
  -e DB_NAME='mercapleno_testv1' `
  mercapleno-docker-backend-1 `
  npx prisma migrate deploy --schema prisma/schema.prisma
```

El resultado fue:

- 4 migraciones aplicadas.
- 19 tablas disponibles.
- Tablas de ventas: `venta`, `venta_productos`.
- Tablas de inventario: `productos`, `stock_actual`, `movimiento`, `salida_productos`.
- Tablas de carrito: `cart`, `cart_items`.
- Tablas de soporte: `usuarios`, `roles`, `metodo`, `categoria`, `tipo_movimiento`, entre otras.

## 4. Configuracion del entorno de pruebas

Se creo `mercapleno-backend/.env.test` con la misma estructura de `.env.docker`, pero para Jest ejecutado desde Windows. Por eso usa el puerto publicado:

```env
DATABASE_URL="mysql://root:root123@127.0.0.1:3307/mercapleno_testv1"
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=mercapleno_testv1
JWT_SECRET=mercapleno-test-secret-v1
```

La diferencia es importante:

- Desde Windows: `127.0.0.1:3307`.
- Desde un contenedor Docker: `db:3306`.

`.env.test` queda excluido por `.gitignore` mediante `.env.*`. El backend normal continúa usando `.env.docker` y la base `mercapleno`.

## 5. Proteccion contra la base equivocada

### Archivo: `tester/integracion/setup-real.ts`

Objetivo:

- Cargar `.env.test` antes de importar `AppModule`.
- Reemplazar variables de entorno previas.
- Detener la ejecucion si `DB_NAME` no es `mercapleno_testv1`.
- Detener la ejecucion si `DATABASE_URL` no contiene `/mercapleno_testv1`.

Esta proteccion evita que una prueba destructiva se ejecute accidentalmente en desarrollo o produccion.

## 6. Configuracion de Jest real

### Archivo: `jest.integration.config.js`

Objetivo:

- Separar las pruebas reales de la configuracion general de Jest.
- Ejecutar solo archivos `*.real.integration.spec.ts`.
- Usar `ts-jest` para TypeScript.
- Cargar `setup-real.ts` antes de las pruebas.
- Ejecutar con un solo worker para evitar colisiones en la base compartida.

El comando agregado en `package.json` es:

```powershell
npm run test:integration:real
```

La dependencia `@types/supertest` se agrego para compilar las pruebas TypeScript que usan el paquete CommonJS `supertest`.

## 7. Bootstrap de la aplicacion real

### Archivo: `tester/integracion/support/real-app.ts`

Objetivo:

- Crear un `TestingModule` importando `AppModule`.
- Crear una aplicacion Nest en memoria.
- Aplicar el prefijo global `api`.
- Aplicar `ValidationPipe` con whitelist, rechazo de propiedades desconocidas y transformacion.
- Inicializar la aplicacion sin ejecutar `app.listen()`.

Esto hace que las llamadas de `supertest` recorran los controladores, guardas, servicios y proveedores reales.

No se importa `main.ts`, porque ese archivo inicia un servidor TCP con `app.listen()`.

## 8. Fixtures y conexion SQL

### Archivo: `tester/integracion/support/test-database.ts`

Objetivo:

- Crear un pool `mysql2/promise` conectado a `mercapleno_testv1`.
- Rechazar cualquier otro nombre de base.
- Insertar datos base requeridos por claves foráneas.
- Crear un usuario de prueba, categoría, cinco productos y sus filas de stock.
- Generar nombres y correos únicos por ejecución.
- Limpiar únicamente los IDs creados por cada caso.

Los cinco productos del fixture cubren los escenarios originales:

- Producto disponible con stock.
- Segundo producto disponible.
- Producto disponible con otro precio.
- Producto deshabilitado.
- Producto disponible sin stock.

La limpieza respeta las dependencias SQL:

1. `cart_items`.
2. `cart`.
3. `venta_productos`.
4. `salida_productos`.
5. Referencias `stock_actual.id_movimiento`.
6. `movimiento`.
7. `venta`.
8. `stock_actual`.
9. `productos`.
10. `usuarios`.
11. `categoria`.

## 9. Migracion de Sales

### Archivo: `tester/integracion/sales/sales-service.real.integration.spec.ts`

Objetivo:

Mantener 17 de los 30 casos, ejecutando los endpoints reales:

- CP-071 a CP-080: catálogo, filtros, categorías y métodos de pago.
- CP-095 a CP-097: métodos de pago y validación.
- CP-099: persistencia completa de la venta.
- CP-100: stock insuficiente sin venta parcial.
- CP-102: autenticación de órdenes.
- CP-103: validación del total.

Cada caso usa:

```text
supertest -> AppModule -> SalesController -> SalesService -> MysqlService -> MariaDB
```

Los casos de escritura consultan MySQL después de la respuesta HTTP para verificar la venta, el detalle, el movimiento, la salida y el stock.

## 10. Migracion de Cart

### Archivo: `tester/integracion/sales/cart-service.real.integration.spec.ts`

Objetivo:

Mantener 13 de los 30 casos, ejecutando los endpoints reales:

- CP-081 a CP-089: alta, consulta, sumas, errores y autenticación.
- CP-091 a CP-094: eliminación y actualización de items.

Cada caso verifica tanto la respuesta HTTP como las filas reales de `cart` y `cart_items` cuando corresponde.

## 11. Ajustes realizados en `SalesService`

### Archivo: `src/sales/sales.service.ts`

Se conservaron dos reglas que existían en la lógica de la suite original y no estaban implementadas en el servicio real:

1. Método `M1` por defecto cuando no se envía método de pago.
2. Validación del total recibido contra la suma de precios reales antes de insertar `venta`.

La validación del total se ejecuta dentro de la transacción y antes del `INSERT INTO venta`. Así, un total incorrecto no deja una venta parcial.

La lógica existente también mantiene:

- `beginTransaction()`.
- Bloqueo de productos con `FOR UPDATE`.
- Inserción en `venta` y `venta_productos`.
- Registro en `movimiento` y `salida_productos`.
- Actualización de `stock_actual`.
- `commit()` cuando todo es correcto.
- `rollback()` ante excepciones.

## 12. Ajustes realizados en `CartService`

### Archivo: `src/cart/cart.service.ts`

Se añadieron validaciones para conservar el comportamiento funcional de la suite original:

- `productId` debe ser entero positivo.
- `quantity` debe ser entero mayor que cero.
- El producto debe existir.
- El producto debe estar `Disponible`.
- La cantidad no puede superar el stock.
- Al incrementar un item existente, la cantidad acumulada tampoco puede superar el stock.
- Al actualizar un item, la nueva cantidad debe respetar el stock.
- Una actualización con cantidad cero devuelve `400` en lugar de eliminar silenciosamente el item.

Estas validaciones se ejecutan antes de insertar o actualizar `cart_items`.

## 13. Primera prueba de humo

### Archivo: `tester/integracion/real-connection.real.integration.spec.ts`

Objetivo:

- Confirmar que `AppModule` puede inicializarse.
- Crear fixtures en MySQL.
- Firmar un JWT con `JwtService` real.
- Consultar `/api/sales/products` mediante HTTP.
- Confirmar que el endpoint lee los fixtures de la base.
- Eliminar los datos en `afterEach`.

Resultado obtenido:

```text
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

## 14. Validacion completa

Se ejecutaron las dos suites migradas:

```powershell
npm run test:integration:real -- `
  --runTestsByPath `
  tester/integracion/sales/sales-service.real.integration.spec.ts `
  tester/integracion/sales/cart-service.real.integration.spec.ts `
  --verbose
```

Resultado:

```text
Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
```

Después de la ejecución se consultó `mercapleno_testv1` y se confirmó:

```text
productos_fixture: 0
categorias_fixture: 0
usuarios_fixture: 0
ventas_fixture: 0
tablas: 19
```

## 15. Archivos agregados y objetivo

| Archivo | Objetivo |
|---|---|
| `mercapleno-backend/.env.test` | Variables aisladas para conectar Jest con `mercapleno_testv1`. |
| `mercapleno-backend/jest.integration.config.js` | Configuración Jest exclusiva para integración real. |
| `mercapleno-backend/tester/integracion/setup-real.ts` | Carga y protección del entorno de pruebas. |
| `mercapleno-backend/tester/integracion/support/real-app.ts` | Bootstrap de `AppModule` sin abrir un puerto. |
| `mercapleno-backend/tester/integracion/support/test-database.ts` | Pool SQL, fixtures y limpieza por caso. |
| `mercapleno-backend/tester/integracion/real-connection.real.integration.spec.ts` | Prueba de humo de conexión, endpoint y limpieza. |
| `mercapleno-backend/tester/integracion/sales/sales-service.real.integration.spec.ts` | 17 pruebas reales de Sales. |
| `mercapleno-backend/tester/integracion/sales/cart-service.real.integration.spec.ts` | 13 pruebas reales de Cart. |
| `.vscode/plan/informe-avance-integracion-real.md` | Bitácora de puntos, comandos y evidencias. |
| `.vscode/plan/plan-integracion-real-sales-cart.md` | Plan original de migración y criterios de aceptación. |

## 16. Resultado final

La nueva lógica de pruebas ya no depende de la API Express simulada. Los 30 casos pasan por la aplicación Nest y consultan una base MariaDB real. Los casos de escritura validan persistencia y efectos secundarios SQL, y cada caso elimina sus fixtures al finalizar.

El backend normal no se redirigió a la base de pruebas: la conexión real de integración se activa únicamente mediante `.env.test` y `jest.integration.config.js`.
