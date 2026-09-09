// ***********************************************
// cypress/support/commands.js
// Comandos personalizados para pruebas por roles
// ***********************************************

const usuarios = require('../fixtures/usuarios.json');

/**
 * cy.loginByRoleUI(role)
 * Ejecuta el flujo completo de inicio de sesión visual según el rol ('cliente', 'empleado', 'admin').
 * Intercepta los endpoints de autenticación para garantizar una ejecución rápida y confiable.
 */
Cypress.Commands.add('loginByRoleUI', (roleKey = 'cliente') => {
  const usuario = usuarios[roleKey];
  if (!usuario) {
    throw new Error(`Rol desconocido "${roleKey}". Opciones válidas: cliente, empleado, admin`);
  }

  const isTwoFactor = roleKey === 'admin' || roleKey === 'empleado';

  // Interceptar endpoint de login inicial
  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: {
      success: true,
      requiresTwoFactor: isTwoFactor,
      pendingToken: isTwoFactor ? `token-2fa-${roleKey}` : undefined,
      message: isTwoFactor ? 'Se envio un codigo de seguridad a tu correo.' : undefined,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        id_rol: usuario.id_rol
      }
    }
  }).as(`loginRequest_${roleKey}`);

  if (isTwoFactor) {
    // Interceptar verificación de 2FA
    cy.intercept('POST', '**/api/auth/verify-login-code', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Inicio de sesion exitoso',
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          id_rol: usuario.id_rol
        }
      }
    }).as(`verify2FARequest_${roleKey}`);
  }

  cy.visit('/login');
  cy.get('#email').clear().type(usuario.email);
  cy.get('#password').clear().type(usuario.password);
  cy.get('button[type="submit"]').click();

  cy.wait(`@loginRequest_${roleKey}`);

  if (isTwoFactor) {
    cy.get('#securityCode').should('be.visible').type('123456');
    cy.get('button[type="submit"]').click();
    cy.wait(`@verify2FARequest_${roleKey}`);
  }
});

/**
 * cy.visitAsRole(url, role)
 * Navega directamente a una ruta inyectando la sesión del rol en localStorage
 * antes de que React Router monte las rutas protegidas (RoleRoute).
 */
Cypress.Commands.add('visitAsRole', (url, roleKey = 'admin') => {
  const usuario = usuarios[roleKey];
  if (!usuario) {
    throw new Error(`Rol desconocido "${roleKey}". Opciones válidas: cliente, empleado, admin`);
  }

  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('user', JSON.stringify({
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        id_rol: usuario.id_rol
      }));
    }
  });
});
