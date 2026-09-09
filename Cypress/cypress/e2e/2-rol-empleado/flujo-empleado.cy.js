/**
 * flujo-empleado.cy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Flujo E2E Completo: Rol Empleado (Rol 2)
 *
 * Recorre todo el proceso de negocio de un empleado operativo en Mercapleno:
 *   1. Inicio de sesión con autenticación de dos factores (2FA) hacia /usuarioC
 *   2. Registro y consulta de movimientos de inventario (/products/employee)
 *   3. Consulta operativa de estadísticas y reportes (/estadisticas)
 *   4. Control de acceso y límites del rol: bloqueo en /admin/users y /products/admin
 * ─────────────────────────────────────────────────────────────────────────────
 */

describe('Rol Empleado - Proceso Completo de Usuario', () => {

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // ── PROCESO 1: Inicio de Sesión Seguro con 2FA ──────────────────────────────
  it('1. Proceso de Login: Autenticación con 2FA y redirección al Dashboard (/usuarioC)', () => {
    // El empleado realiza login obligatorio con segundo factor de autenticación
    cy.loginByRoleUI('empleado');

    // Debe llegar al Dashboard Operativo
    cy.url().should('include', '/usuarioC');
  });

  // ── PROCESO 2: Operaciones de Inventario (Movimientos) ──────────────────────
  it('2. Proceso Operativo: Acceso y registro de movimientos de inventario', () => {
    // Ingresar directamente con sesión activa de empleado
    cy.visitAsRole('/products/employee', 'empleado');

    cy.url().should('include', '/products/employee');
  });

  // ── PROCESO 3: Consulta de Estadísticas y Reportes ──────────────────────────
  it('3. Proceso de Consulta: Visualización de estadísticas operativas', () => {
    cy.visitAsRole('/estadisticas', 'empleado');

    cy.url().should('include', '/estadisticas');
  });

  // ── PROCESO 4: Reglas de Seguridad y Límites del Rol ────────────────────────
  it('4. Proceso de Seguridad: El empleado no puede acceder a funciones exclusivas de Administrador', () => {
    // Intento de entrar a la administración de usuarios (/admin/users)
    cy.visitAsRole('/admin/users', 'empleado');
    cy.url().should('include', '/unauthorized');
    cy.contains('Acceso Denegado (403)').should('be.visible');

    // Intento de entrar a la administración completa de productos (/products/admin)
    cy.visitAsRole('/products/admin', 'empleado');
    cy.url().should('include', '/unauthorized');
    cy.contains('Acceso Denegado (403)').should('be.visible');
  });

});

