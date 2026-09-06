# Plan de integracion real para Sales y Cart

## Objetivo

Convertir la suite simulada de `mercapleno-backend/tester/integracion/sales/sales.integration.test.js` en pruebas de integracion contra la aplicacion Nest real y una base de datos MySQL exclusiva para pruebas, conservando los 30 identificadores CP-071 a CP-103.

La suite debe comprobar el comportamiento HTTP, la persistencia, las relaciones entre tablas, las transacciones y la restauracion del estado. No se deben usar `productsDb`, `cartDb`, `salesDb`, rutas Express artesanales ni mocks de `MysqlService` en estas pruebas.

## Hallazgos que condicionan la migracion

- La suite actual implementa una API Express simulada y almacena todo en arreglos JavaScript.
- La aplicacion real se compone de `AppModule`, `SalesController`, `SalesService`, `CartController` y `CartService`.
- `SalesService` usa `MysqlService`, abre una conexion, ejecuta `beginTransaction`, inserta la venta y sus detalles, registra movimientos, actualiza `stock_actual` y ejecuta `commit`.
- `CartService` persiste en `cart` y `cart_items` y obtiene precios y existencias desde MySQL.
- `main.ts` aplica el prefijo global `api`, guardas JWT, pipes de validacion, cookies y filtros. Para las pruebas se debe replicar la configuracion necesaria sin llamar a `app.listen()`.
- Las rutas reales de catalogo, categorias y metodos de pago tienen `@Public()`. Por ello CP-073 y CP-080 no pueden conservar literalmente el rechazo por falta de token de la API simulada; deben conservar sus identificadores y validar el contrato real: acceso publico exitoso. El acceso protegido que corresponda debe probarse en `POST /api/sales/orders` y en las rutas privadas del carrito.
- Las pruebas existentes mezclan ventas y carrito. La migracion debe separar responsabilidades sin perder ningun caso.

## Distribucion de los 30 casos

### `sales-service.real.integration.spec.ts`

Usar `AppModule`, `SalesController` y `SalesService` reales. Mantener estos casos:

- CP-071: catalogo con productos disponibles y stock.
- CP-072: excluir productos inactivos y sin stock.
- CP-073: conservar el caso, pero verificar el comportamiento real de ruta publica.
- CP-074: paginacion. Si el controlador real no soporta `page` y `limit`, documentar el desajuste y adaptar la asercion al contrato real sin simular paginacion.
- CP-075: filtros de nombre, categoria y rango de precios.
- CP-076: busqueda por nombre.
- CP-077: filtro por categoria.
- CP-078: filtro por rango de precios.
- CP-079: busqueda sin coincidencias.
- CP-080: conservar el caso, pero verificar acceso publico real o mover la asercion de autenticacion a una ruta protegida.
- CP-095: metodo de pago valido al crear una orden.
- CP-096: metodo de pago por defecto, solo si el DTO/servicio real mantiene ese contrato; de lo contrario actualizar la expectativa al contrato implementado.
- CP-097: metodo de pago invalido.
- CP-099: crear orden, persistir venta y descontar stock.
- CP-100: rechazar una orden cuando el stock real es insuficiente.
- CP-102: rechazar crear orden sin autenticacion.
- CP-103: rechazar totales invalidos segun el DTO y servicio reales.

### `cart-service.real.integration.spec.ts`

Usar `AppModule`, `CartController` y `CartService` reales. Mantener estos casos:

- CP-081: agregar producto al carrito y consultar su estado.
- CP-082: cantidad superior al stock, adaptando la expectativa al comportamiento real de `CartService`.
- CP-083: producto inactivo, si el servicio real lo rechaza; si actualmente solo valida existencia, registrar la brecha como defecto y no maquillarla en la prueba.
- CP-084: agregar el mismo producto dos veces y verificar incremento sin duplicado.
- CP-085: datos invalidos del carrito.
- CP-086: productos, subtotales, impuesto y total mediante `GET /api/cart/sum`.
- CP-087: carrito vacio mediante `GET /api/cart` y/o `GET /api/cart/sum`.
- CP-088: calculo exacto de subtotal, impuesto y total.
- CP-089: acceso sin autenticacion a carrito privado.
- CP-091: eliminar item y verificar el resultado persistido.
- CP-092: actualizar cantidad y validar el contrato real de `CartService`.
- CP-093: actualizar cantidad valida sin duplicar.
- CP-094: actualizar con datos invalidos; considerar que el servicio real elimina cuando `quantity <= 0`, por lo que la expectativa debe reflejar ese contrato o señalar la diferencia.

Los cuatro casos de checkout CP-099, CP-100, CP-102 y CP-103 pueden necesitar datos de carrito para preparar el escenario, pero pertenecen a `SalesService` porque ejercitan `POST /api/sales/orders`. El carrito se prepara directamente mediante sus endpoints reales o mediante fixtures SQL controlados, nunca mediante arreglos locales.

## Estructura propuesta

```text
mercapleno-backend/
  tester/
    integracion/
      sales/
        sales-service.real.integration.spec.ts
        cart-service.real.integration.spec.ts
      support/
        real-app.ts
        test-database.ts
        fixtures.ts
```

`real-app.ts` debe crear el `TestingModule` con `imports: [AppModule]`, crear la aplicacion Nest, configurar `api`, `ValidationPipe` y cualquier middleware imprescindible, y cerrarla en `afterAll`.

Ejemplo de bootstrap de prueba:

```ts
const moduleFixture = await Test.createTestingModule({
  imports: [AppModule],
}).compile();

app = moduleFixture.createNestApplication();
app.setGlobalPrefix('api');
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
await app.init();
```

No importar `main.ts`, porque inicia un servidor con `app.listen()`.

## Base de datos exclusiva de pruebas

### 1. Crear la base

Crear una base MySQL separada de desarrollo y produccion:

```sql
CREATE DATABASE mercapleno_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

El usuario de pruebas debe tener permisos solo sobre `mercapleno_test`.

### 2. Configurar el entorno

Crear un archivo no versionado, por ejemplo `mercapleno-backend/.env.test`:

```env
NODE_ENV=test
DATABASE_URL=mysql://test_user:test_password@127.0.0.1:3306/mercapleno_test
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=mercapleno_test
JWT_SECRET=test-secret
JWT_EXPIRES_IN=1h
INTERNAL_API_KEY=test-internal-key
SMTP_HOST=127.0.0.1
SMTP_PORT=2525
```

No reutilizar el `.env` de desarrollo. La configuracion de Jest debe cargar `.env.test` antes de importar `AppModule`.

### 3. Crear tablas y datos base

Aplicar la estructura mediante las migraciones del proyecto:

```powershell
$env:NODE_ENV = 'test'
npx prisma migrate deploy
```

Si el esquema contiene tablas administradas directamente por MySQL y no por Prisma, aplicar el dump de estructura correspondiente y comprobar que existan al menos:

- `roles`
- `tipos_identificacion`
- `usuarios`
- `categoria`
- `productos`
- `stock_actual`
- `metodo`
- `tipo_movimiento`
- `movimiento`
- `salida_productos`
- `venta`
- `venta_productos`
- `cart`
- `cart_items`

Cargar solo catálogos necesarios y fixtures de prueba controlados: roles, tipo de identificacion, metodos `M1`, `M2`, `M3`, categorias y productos. Los productos deben tener precios y stock conocidos. No depender de IDs fijos de desarrollo; guardar los IDs retornados por los inserts.

### 4. Usuario y autenticacion

Crear un usuario cliente de prueba por suite o por caso, con email y numero de identificacion unicos. Generar un JWT firmado con el mismo `JWT_SECRET` de `.env.test` y el `sub`/`id` del usuario insertado. No usar el token fijo `mock-cliente-jwt-token-abc`.

La autenticacion puede prepararse de dos formas:

- Registrar/verificar/login mediante las rutas reales, cuando el caso de autenticacion sea parte del objetivo.
- Insertar un usuario fixture y firmar un JWT de prueba, cuando se quiera aislar Sales/Cart de correo y del flujo completo de Auth.

No mockear `MysqlService`. Se permite controlar SMTP solo para evitar envio externo, pero ese control debe quedar fuera de la base de datos.

## Aislamiento y limpieza

### Identificador de ejecucion

Crear un identificador unico por suite:

```ts
const runId = `it-${Date.now()}-${process.pid}`;
```

Usarlo en emails, numero de identificacion y nombres de productos de prueba. Registrar los IDs insertados en memoria para limpiar exactamente lo creado por la prueba.

### Limpieza por caso

Usar `beforeEach` para crear un usuario, productos, stock y carrito nuevos, o restaurar el stock original capturando sus valores antes de modificarlo. Usar `afterEach` con consultas parametrizadas y orden de dependencias:

1. Eliminar `cart_items` de los carritos creados.
2. Eliminar `cart` creados.
3. Eliminar `venta_productos` de las ventas creadas.
4. Eliminar `salida_productos` asociados a los movimientos de prueba.
5. Poner en `NULL` las referencias `stock_actual.id_movimiento` de los movimientos creados o restaurar exactamente el stock capturado.
6. Eliminar `movimiento` creado por las órdenes.
7. Eliminar `venta` creada por las pruebas.
8. Eliminar `usuarios` creados por la prueba.
9. Eliminar `productos` creados por la prueba.
10. Eliminar categorias creadas, solo si no tienen otras referencias.

Las eliminaciones deben usar IDs capturados, no `DELETE` globales. Como segunda barrera, `afterAll` debe ejecutar una limpieza por prefijo `runId` y cerrar la conexion/pool.

### Transacciones

No asumir que un rollback externo deshace `SalesService.createOrder()`: el servicio obtiene su propia conexion y hace `commit`. La estrategia inicial debe ser limpieza explicita despues de cada caso.

Como mejora posterior, refactorizar `SalesService.createOrder()` para aceptar una conexion transaccional opcional o extraer la logica transaccional a una unidad reutilizable. Eso permitiria ejecutar ciertos casos con rollback, aunque las pruebas end-to-end de commit real deben conservar al menos un caso que verifique persistencia antes de limpiar.

## Casos que deben verificar la base, no solo HTTP

Para CP-099 comprobar despues del `POST /api/sales/orders`:

- Existe una fila en `venta` con usuario, metodo y total esperados.
- Existe una fila en `venta_productos` por cada item.
- Existe `salida_productos` por cada item.
- Existe `movimiento` asociado.
- `stock_actual.stock` disminuyo exactamente la cantidad vendida.
- La respuesta contiene el identificador real de la venta o ticket que el controlador exponga.

Para CP-100, CP-102 y CP-103 comprobar que no quedan filas parciales en `venta`, `venta_productos`, `salida_productos` ni `movimiento`, y que el stock permanece igual.

Para CP-081 a CP-094 comprobar directamente `cart` y `cart_items`, incluyendo:

- Un solo carrito activo por usuario.
- Un solo item por producto dentro del carrito.
- `price_snapshot` correcto.
- Cantidad persistida y eliminacion efectiva.
- Usuario aislado de carritos de otros usuarios.

## Configuracion y comandos

Agregar una configuracion de Jest para TypeScript e integracion real, con `testEnvironment: 'node'`, `runInBand` y carga de `.env.test`. Corregir el script actual que apunta a `integration/`; la carpeta real es `integracion/`.

Comandos previstos:

```powershell
Set-Location mercapleno-backend/tester
npm install
$env:NODE_ENV = 'test'
npx prisma migrate deploy --schema ../prisma/schema.prisma
npx jest integracion/sales/sales-service.real.integration.spec.ts --runInBand
npx jest integracion/sales/cart-service.real.integration.spec.ts --runInBand
npx jest integracion/sales --runInBand --coverage
```

Antes de ejecutar, confirmar que MySQL de pruebas está levantado y que `DATABASE_URL` apunta a `mercapleno_test`. Nunca ejecutar esta suite si `DB_NAME` coincide con la base de desarrollo o produccion.

## Criterios de aceptacion

- Se mantienen los 30 identificadores CP-071 a CP-103.
- La suite usa `AppModule` y los controladores/servicios reales.
- No existen arreglos `productsDb`, `cartDb` o `salesDb` en las pruebas reales.
- No se reemplaza `MysqlService` por un mock.
- Se valida persistencia y efectos secundarios SQL en los casos de escritura.
- Se separan los casos entre Sales y Cart sin duplicar IDs.
- La base de pruebas queda sin registros creados por la ejecucion, incluso cuando una prueba falla.
- Se comprueba rollback real del servicio ante error y ausencia de ventas parciales.
- Las pruebas no requieren enviar correos ni conectarse a SMTP externo.
- Se documentan como diferencias de contrato los casos cuyo resultado cambia por la implementacion real, especialmente rutas publicas, paginacion y validacion de stock del carrito.
