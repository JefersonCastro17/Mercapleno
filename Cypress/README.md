# Mercapleno E2E - Pruebas Cypress por Roles

Suite de pruebas End-to-End (E2E) para Mercapleno estructurada por **Roles y Procesos de Usuario**. Cada flujo recorre de punta a punta el viaje completo que realiza cada tipo de usuario en el sistema.

---

## 👥 Estructura por Roles

```
cypress/
├── e2e/
│   ├── 1-rol-cliente/
│   │   └── flujo-cliente.cy.js          # Onboarding -> Login directo -> Catálogo -> Carrito -> Ticket -> Acceso denegado
│   ├── 2-rol-empleado/
│   │   └── flujo-empleado.cy.js         # Login 2FA -> Dashboard -> Movimientos de Inventario -> Estadísticas -> Restricciones
│   └── 3-rol-administrador/
│       └── flujo-administrador.cy.js    # Login 2FA -> Dashboard -> Gestión Productos -> Gestión Usuarios -> Reportes PDF
├── fixtures/
│   ├── usuarios.json                    # Datos maestros de credenciales por rol (cliente, empleado, admin)
│   └── example.json
└── support/
    ├── commands.js                      # cy.loginByRoleUI(), cy.visitAsRole()
    └── e2e.js
```

---

## 📋 Procesos Cubiertos por Cada Rol

### 1. Rol Cliente (`1-rol-cliente/flujo-cliente.cy.js`)

- **Proceso 1:** Registro de usuario con validación de tipo de documento y verificación de correo.
- **Proceso 2:** Inicio de sesión directo (sin requerir 2FA) y redirección inmediata al catálogo (`/catalogo`).
- **Proceso 3:** Navegación por el catálogo, carrito de compras (`/cart`) y generación de comprobante (`/ticket`).
- **Proceso 4:** Verificación de seguridad: denegación de acceso (`403 Unauthorized`) al intentar ingresar a paneles administrativos (`/usuarioC`, `/admin/users`, `/products/admin`).

### 2. Rol Empleado (`2-rol-empleado/flujo-empleado.cy.js`)

- **Proceso 1:** Inicio de sesión con autenticación de dos factores (2FA obligatorio) hacia el panel de operaciones (`/usuarioC`).
- **Proceso 2:** Gestión operativa de movimientos de inventario (`/products/employee`).
- **Proceso 3:** Consulta de estadísticas y reportes de la tienda (`/estadisticas`).
- **Proceso 4:** Control de acceso: bloqueo y redirección de seguridad al intentar ingresar a la administración de usuarios (`/admin/users`) o configuración exclusiva de administrador (`/products/admin`).

### 3. Rol Administrador (`3-rol-administrador/flujo-administrador.cy.js`)

- **Proceso 1:** Inicio de sesión seguro con 2FA hacia el Dashboard (`/usuarioC`).
- **Proceso 2:** Administración integral de productos (`/products/admin`): creación con categoría/proveedor, edición y eliminación con confirmación.
- **Proceso 3:** Gestión de usuarios (`/admin/users`): listado, búsqueda por texto, creación, modificación de perfil y eliminación.
- **Proceso 4:** Inteligencia de negocio y reportes (`/estadisticas`): actualización de métricas, filtrado por rango de fechas y exportación/descarga de PDF.

---

## 🚀 Instalación y Ejecución

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecución interactiva (Cypress Test Runner UI)

```bash
npm run cy:open
```

### 3. Ejecución por Roles (Modo Headless)

```bash
# Ejecutar solo el proceso del Cliente
npm run cy:run:cliente

# Ejecutar solo el proceso del Empleado
npm run cy:run:empleado

# Ejecutar solo el proceso del Administrador
npm run cy:run:admin

# Ejecutar todos los roles en secuencia
npm run cy:run:roles
```
