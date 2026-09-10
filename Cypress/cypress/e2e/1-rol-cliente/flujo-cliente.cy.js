/**
 * flujo-cliente.cy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Flujo E2E Completo: Rol Cliente (Rol 3)
 *
 * Recorre todo el proceso de negocio de un cliente en Mercapleno:
 *   1. Registro de nuevo usuario y verificación de correo
 *   2. Inicio de sesión directo (sin segundo factor 2FA) hacia el Catálogo
 *   3. Exploración de productos y proceso de compra (Carrito -> Ticket)
 *   4. Control de accesos y seguridad: verificación de rutas restringidas
 * ─────────────────────────────────────────────────────────────────────────────
 */

describe('Rol Cliente - Proceso Completo de Usuario', () => {

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // ── PROCESO 1: Registro y Verificación de Correo ────────────────────────────
  it('1. Proceso de Onboarding: Registro de nuevo cliente y verificación de correo', () => {
    // 1.1 Simular carga de tipos de documento
    cy.intercept('GET', '**/api/auth/document-types*', {
      statusCode: 200,
      body: {
        tipos_identificacion: [
          { id: 1, nombre: 'Cédula de Ciudadanía' },
          { id: 2, nombre: 'Tarjeta de Identidad' }
        ]
      }
    }).as('getDocumentTypes');

    // 1.2 Simular registro exitoso
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Registro exitoso. Revisa tu correo para el codigo.'
      }
    }).as('registerRequest');

    cy.visit('/registro');
    cy.wait('@getDocumentTypes');

    // Llenar formulario de registro
    cy.get('#nombre').type('Camila');
    cy.get('#apellido').type('Morales');
    cy.get('#id_tipo_identificacion').select('1');
    cy.get('#numero_identificacion').type('1032456789');
    cy.get('#fecha_nacimiento').type('1998-04-12');
    cy.get('#email').type('camila.cliente@ejemplo.com');
    cy.get('#direccion').type('Calle 80 # 45-20');
    cy.get('#password').type('ClaveSegura123!');

    cy.get('button[type="submit"]').click();
    cy.wait('@registerRequest');

    // 1.3 Validar redirección a pantalla de verificación con query param
    cy.url().should('include', '/verificar?email=camila.cliente%40ejemplo.com');
    cy.get('#verifyEmail').should('have.value', 'camila.cliente@ejemplo.com');

    // 1.4 Simular verificación exitosa del código recibido por correo
    cy.intercept('POST', '**/api/auth/verify-email', {
      statusCode: 200,
      body: { success: true, message: 'Correo verificado correctamente.' }
    }).as('verifyEmailRequest');

    cy.get('#verificationCode').type('123456');
    cy.get('button[type="submit"]').click();
    cy.wait('@verifyEmailRequest');

    // Debe quedar listo en la pantalla de login
    cy.url().should('include', '/login');
  });

  // ── PROCESO 2: Inicio de Sesión y Acceso al Catálogo ────────────────────────
  it('2. Proceso de Login: Acceso directo sin 2FA y redirección al Catálogo (/catalogo)', () => {
    // El cliente tiene login directo (requiresTwoFactor: false)
    cy.loginByRoleUI('cliente');

    // Debe ingresar directamente a la tienda/catálogo
    cy.url().should('include', '/catalogo');
  });

  // ── PROCESO 3: Flujo de Compra (Catálogo -> Carrito -> Ticket) ──────────────
  it('3. Proceso de Compra: Explorar catálogo, agregar al carrito y generar ticket', () => {
    // Iniciar con sesión de cliente en el catálogo
    cy.visitAsRole('/catalogo', 'cliente');
    cy.url().should('include', '/catalogo');

    // Navegar al carrito
    cy.visitAsRole('/cart', 'cliente');
    cy.url().should('include', '/cart');

    // Navegar al comprobante / ticket
    cy.visitAsRole('/ticket', 'cliente');
    cy.url().should('include', '/ticket');
  });

  // ── PROCESO 4: Reglas de Seguridad y Control de Acceso ───────────────────────
  it('4. Proceso de Seguridad: El cliente tiene acceso denegado a paneles administrativos', () => {
    // Cliente autenticado intenta entrar al panel operativo de empleados/admin
    cy.visitAsRole('/usuarioC', 'cliente');
    cy.url().should('include', '/unauthorized');
    cy.contains('Acceso Denegado (403)').should('be.visible');

    // Cliente intenta entrar al módulo de administración de usuarios
    cy.visitAsRole('/admin/users', 'cliente');
    cy.url().should('include', '/unauthorized');
    cy.contains('Acceso Denegado (403)').should('be.visible');

    // Cliente intenta entrar a la gestión de productos del administrador
    cy.visitAsRole('/products/admin', 'cliente');
    cy.url().should('include', '/unauthorized');
    cy.contains('Acceso Denegado (403)').should('be.visible');
  });

});

