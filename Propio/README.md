# Mercapleno React Vite

Frontend React migrado a Vite para Mercapleno.
Este proyecto consume el backend unificado en `http://localhost:4000` y separa responsabilidades en `app/` por modulos (routes, contexts, components, lib, styles).

## 1. Requisitos
- Node.js 18+ recomendado.
- npm 9+ recomendado.
- Backend levantado en:
  - `C:\Users\jefer\OneDrive\Escritorio\mercaplen_final_version\mercapleno-backend`

## 2. Como ejecutar
### 2.1 Backend
```powershell
cd C:\Users\jefer\OneDrive\Escritorio\mercaplen_final_version\mercapleno-backend
npm install
npm start
```

### 2.2 Frontend
```powershell
cd C:\Users\jefer\OneDrive\Escritorio\mercapleno-react-vite
npm install
npm run dev
```

## 3. Variables de entorno
Archivo: `.env`
```env
VITE_API_URL=http://localhost:4000
```

Archivo plantilla: `.env.example`

## 4. Arquitectura general
- Entrada de app: `src/main.jsx`.
- Composicion raiz: `app/root.jsx`.
- Proveedores globales: `app/providers.jsx`.
- Router principal y control de roles: `app/App.jsx`.
- Contextos globales: `app/contexts/*`.
- Capa de API: `app/lib/config/*` + `app/lib/api/httpClient.js` + `app/lib/services/*`.
- Pantallas: `app/routes/*`.
- UI reutilizable: `app/components/*`.
- Estilos por modulo: `app/styles/*`.

## 5. Control de acceso por rol
Definicion usada por frontend:
- Rol `1`: Administrador.
- Rol `2`: Empleado.
- Rol `3`: Cliente.

Rutas protegidas principales (definidas en `app/App.jsx`):
- `/catalogo`, `/cart`, `/ticket`: roles 1, 2, 3.
- `/usuarioC`: roles 1, 2.
- `/products/admin`: rol 1.
- `/products/employee`: roles 1, 2.
- `/admin/users`: rol 1.
- `/estadisticas`: roles 1, 2.

## 6. Capa API (resumen)
- URL base: `VITE_API_URL` en `app/lib/config/env.js`.
- Endpoints centralizados: `app/lib/config/api.config.js`.
- Cliente HTTP comun: `app/lib/api/httpClient.js`.
- Manejo de token Bearer automatico con `auth: true`.
- Prevencion de error `GET/HEAD cannot have body` ya implementada.

## 7. Archivo por archivo

### 7.1 Raiz del proyecto
| Archivo | Funcion especifica |
|---|---|
| `.env` | Configuracion local real del frontend. Define `VITE_API_URL` para desarrollo. |
| `.env.example` | Plantilla de variables para nuevos entornos sin exponer configuracion local. |
| `.gitignore` | Excluye `node_modules`, `dist`, logs y archivos de editor. |
| `eslint.config.js` | Configuracion ESLint flat para JS/JSX con reglas de React Hooks y Vite. |
| `index.html` | HTML base de Vite. Contiene `<div id="root">` y carga `src/main.jsx`. |
| `package.json` | Scripts (`dev`, `build`, `lint`, `preview`) y dependencias del proyecto. |
| `package-lock.json` | Lockfile de npm para versionado exacto de dependencias. |
| `README.md` | Documentacion tecnica del proyecto y mapa de archivos. |
| `vite.config.js` | Configuracion de Vite con plugin React. |

### 7.2 Carpeta `src/`
| Archivo | Funcion especifica |
|---|---|
| `src/main.jsx` | Entry point. Monta React en `#root` y renderiza `app/root.jsx` dentro de `StrictMode`. |

### 7.3 Carpeta `app/` (core)
| Archivo | Funcion especifica |
|---|---|
| `app/root.jsx` | Une `Providers` + `App`. Es la raiz logica de la aplicacion. |
| `app/providers.jsx` | Registra proveedores globales: `BrowserRouter` y `AuthProvider`. |
| `app/App.jsx` | Router principal. Define rutas publicas, rutas protegidas y control por rol con `RoleRoute`. |
| `app/logo.svg` | Recurso visual usado en pantallas de autenticacion. |

### 7.4 `app/contexts/`
| Archivo | Funcion especifica |
|---|---|
| `app/contexts/AuthContext.jsx` | Gestion de sesion (`user`, `token`, `isAuthenticated`), persistencia en `localStorage`, helpers de usuario y hook `useAuthContext`. |
| `app/contexts/CartContext.jsx` | Inyecta el estado/acciones del carrito a toda la app usando `useCart()`. |

### 7.5 `app/lib/config/`
| Archivo | Funcion especifica |
|---|---|
| `app/lib/config/env.js` | Lee `VITE_API_URL`, define fallback `http://localhost:4000`, normaliza slash final. |
| `app/lib/config/api.config.js` | Catalogo de endpoints por modulo (`auth`, `admin`, `products`, `sales`, `movements`). |
| `app/lib/config/.gitkeep` | Mantiene el directorio versionado aunque este vacio en algunos flujos. |

### 7.6 `app/lib/api/`
| Archivo | Funcion especifica |
|---|---|
| `app/lib/api/httpClient.js` | Cliente HTTP central: construye URL, agrega auth Bearer, parsea JSON/blob, lanza errores con `status` y `data`. |
| `app/lib/api/.gitkeep` | Placeholder de versionado del directorio. |

### 7.7 `app/lib/hooks/`
| Archivo | Funcion especifica |
|---|---|
| `app/lib/hooks/useCart.js` | Logica del carrito: persistencia local, cantidades, totales y `processCheckout` con envio de orden al backend. |
| `app/lib/hooks/.gitkeep` | Placeholder de versionado del directorio. |

### 7.8 `app/lib/services/`
| Archivo | Funcion especifica |
|---|---|
| `app/lib/services/productData.js` | Servicio principal de ventas: listar productos, categorias, enviar orden (`/api/sales`). Incluye `formatPrice`. |
| `app/lib/services/reportesService.js` | Servicio de reportes: ventas por mes, top productos, resumen, descarga/impresion de PDF. |
| `app/lib/services/imageUtils.js` | Resuelve rutas de imagen (URL absoluta, publica, relativa) y fallback `public/images/placeholder.svg`. |
| `app/lib/services/inventarioService.js` | Archivo legado copiado del proyecto anterior. Actualmente no se usa en rutas activas y contiene codigo no integrado. |
| `app/lib/services/.gitkeep` | Placeholder de versionado del directorio. |

### 7.9 `app/lib/`
| Archivo | Funcion especifica |
|---|---|
| `app/lib/supabaseClient.js` | Inicializa cliente Supabase con URL y key embebidas. No es parte del flujo principal de login/ventas actual. |
| `app/lib/utils/.gitkeep` | Placeholder de versionado del directorio `utils`. |

### 7.10 `app/components/features/`
| Archivo | Funcion especifica |
|---|---|
| `app/components/features/FilterBar.jsx` | Barra de filtros de catalogo. Emite cambios al padre con debounce por nombre. |
| `app/components/features/TotalsSummary.jsx` | Resumen monetario del carrito (productos, subtotal, impuesto, total). |
| `app/components/features/.gitkeep` | Placeholder de versionado del directorio. |

### 7.11 `app/components/ui/`
| Archivo | Funcion especifica |
|---|---|
| `app/components/ui/Header.jsx` | Navbar superior para usuario autenticado: nombre, logout, acceso a catalogo y carrito. |
| `app/components/ui/ProductCard.jsx` | Tarjeta de producto del catalogo, render de imagen y accion `agregar al carrito`. |
| `app/components/ui/CartItem.jsx` | Item de carrito con controles `+`, `-`, eliminar y subtotal por linea. |
| `app/components/ui/.gitkeep` | Placeholder de versionado del directorio. |

### 7.12 `app/routes/`
| Archivo | Funcion especifica |
|---|---|
| `app/routes/Login.jsx` | Inicio de sesion. Si el backend exige segundo factor para admin/empleado, solicita el codigo real enviado por correo antes de guardar la sesion. |
| `app/routes/Registro.jsx` | Registro de usuario cliente (`id_rol=3`) con validacion minima y redireccion a verificacion. |
| `app/routes/Verificar.jsx` | Verificacion de correo y reenvio de codigo. |
| `app/routes/Recuperar.jsx` | Recuperacion de clave en 2 pasos: solicitar codigo y resetear clave. |
| `app/routes/InventoryPage.jsx` | Catalogo publico autenticado con filtros y carga desde `/api/sales/products`. |
| `app/routes/CartPage.jsx` | Carrito, seleccion de metodo de pago, checkout y persistencia para ticket. |
| `app/routes/TicketPage.jsx` | Ticket final de compra usando `lastPurchasedCart` y `lastPurchasedTotals` del `localStorage`. |
| `app/routes/AdminDashboard.jsx` | Dashboard operativo para roles 1 y 2 con accesos rapidos a modulos administrativos. |
| `app/routes/usuarioC.jsx` | CRUD de usuarios (admin), con modal de edicion/creacion y llamadas autenticadas a `/api/admin/users`. |
| `app/routes/Lista_productos.jsx` | CRUD de productos (admin) sobre `/api/productos` con modales de agregar/editar. |
| `app/routes/RegistroMovimientos.jsx` | Registro de entradas/salidas de inventario para operacion (`/api/movimientos`). |
| `app/routes/Estadisticas.jsx` | Tablero de analitica con graficas `recharts`, filtros por mes y exportacion/impresion PDF. |

### 7.13 `app/styles/`
| Archivo | Funcion especifica |
|---|---|
| `app/styles/base.css` | Variables globales y estilos base compartidos (navbar, botones, inputs). |
| `app/styles/login.css` | Estilo de la pantalla de inicio de sesion. |
| `app/styles/registro.css` | Estilo de registro, verificacion y recuperacion de clave. |
| `app/styles/inventory.css` | Estilo del catalogo (`InventoryPage`) y tarjetas de producto. |
| `app/styles/cart.css` | Estilo del carrito y resumen de pago. |
| `app/styles/ticket.css` | Estilo del ticket de compra e impresion. |
| `app/styles/adminDashboard.css` | Estilo del dashboard operativo `/usuarioC` (accesos rapidos y cabecera). |
| `app/styles/usuarioC.css` | Estilo del modulo CRUD de usuarios (`usuarioC.jsx`). |
| `app/styles/Lista_productos.css` | Estilo del CRUD de productos y del modulo de movimientos (tabla/modal). |
| `app/styles/estadisticas.css` | Estilo del dashboard de reportes (`Estadisticas.jsx`). |
| `app/styles/crudU.css` | Archivo referencial/legado con comentarios de estilos, no es la hoja principal usada en runtime. |

### 7.14 `public/`
| Archivo | Funcion especifica |
|---|---|
| `public/favicon.ico` | Icono de navegador. |
| `public/robots.txt` | Reglas para crawlers. |
| `public/vite.svg` | Icono por defecto de Vite (tambien usado como favicon actual en `index.html`). |
| `public/images/placeholder.svg` | Imagen fallback cuando falla una imagen de producto. |
| `public/images/productos/ariel.jpg` | Ejemplo de imagen de producto local. |
| `public/images/productos/.gitkeep` | Placeholder para mantener la carpeta en Git sin subir mas binarios. |

## 8. Flujo funcional principal
### 8.1 Login
1. `Login.jsx` envia credenciales a `httpClient` usando endpoint de `api.config.js`.
2. `AuthContext.login()` persiste `user` y `token`.
3. `App.jsx` redirige segun rol (`/catalogo` o `/usuarioC`).

### 8.2 Catalogo y compra
1. `InventoryPage.jsx` usa `getProducts()` y `getCategories()`.
2. `ProductCard.jsx` agrega items al carrito via `CartContext`.
3. `CartPage.jsx` ejecuta `processCheckout()`.
4. `TicketPage.jsx` muestra comprobante de la compra.

### 8.3 Administracion
1. `AdminDashboard.jsx` sirve de hub por rol.
2. `usuarioC.jsx` administra usuarios.
3. `Lista_productos.jsx` administra productos.
4. `RegistroMovimientos.jsx` registra movimientos de inventario.
5. `Estadisticas.jsx` consulta analitica y exporta PDF.

## 9. Comandos utiles
```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## 10. Notas tecnicas actuales
- El frontend esta alineado a backend en puerto `4000` por `VITE_API_URL`.
- Existe un archivo legado no integrado: `app/lib/services/inventarioService.js`.
- El flujo principal usa `httpClient` centralizado para evitar URLs hardcodeadas.
