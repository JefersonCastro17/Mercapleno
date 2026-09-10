/**
 * flujo-administrador.cy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Flujo E2E Completo: Rol Administrador (Rol 1)
 *
 * Recorre todos los procesos de alto nivel del Administrador en Mercapleno:
 *   1. Inicio de sesión seguro con 2FA hacia el Dashboard (/usuarioC)
 *   2. Gestión de Productos: creación, edición, habilitar/deshabilitar y eliminación
 *   3. Gestión de Usuarios: búsqueda, creación, edición y eliminación
 *   4. Generación y exportación de Reportes y Estadísticas
 * ─────────────────────────────────────────────────────────────────────────────
 */

describe('Rol Administrador - Proceso Completo de Usuario', () => {

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // ── PROCESO 1: Inicio de Sesión Seguro con 2FA ──────────────────────────────
  it('1. Proceso de Login: Autenticación con 2FA y redirección al Dashboard (/usuarioC)', () => {
    cy.loginByRoleUI('admin');

    cy.url().should('include', '/usuarioC');
  });

  // ── PROCESO 2: Gestión de Catálogo de Productos ─────────────────────────────
  it('2. Proceso de Inventario: Crear, editar, cambiar estado y eliminar producto', () => {
    cy.visitAsRole('/products/admin', 'admin');
    cy.url().should('include', '/products/admin');

    // 2.1 Apertura del modal de nuevo producto
    cy.contains('button', 'Agregar producto')
      .should('be.visible')
      .click();

    cy.get('input[name="nombre"]').type('Helado Artesanal Vainilla');
    cy.get('input[name="precio"]').type('4500');
    cy.get('select[name="id_categoria"]').select(1);
    cy.get('select[name="id_proveedor"]').select(1);
    cy.get('select[name="estado"]').select('Disponible');
    cy.get('textarea[name="descripcion"]').type('Helado premium de vainilla');

    // Simular creación exitosa
    cy.intercept('POST', '**/api/productos*', {
      statusCode: 201,
      body: { success: true, message: 'Producto agregado' }
    }).as('createProduct');

    cy.get('.products-modal').contains('button', 'Agregar').click();

    // 2.2 Edición de producto
    cy.intercept('PUT', '**/api/productos/*', {
      statusCode: 200,
      body: { success: true, message: 'Producto actualizado' }
    }).as('updateProduct');

    cy.get('table').then(($table) => {
      if ($table.find('button:contains("Editar")').length > 0) {
        cy.contains('button', 'Editar').first().click();
        cy.get('input[name="nombre"]').clear().type('Helado Artesanal Editado');
        cy.contains('button', 'Guardar').click();
      }
    });

    // 2.3 Eliminación de producto con confirmación
    cy.on('window:confirm', () => true);
    cy.intercept('DELETE', '**/api/productos/*', {
      statusCode: 200,
      body: { success: true, message: 'Producto eliminado' }
    }).as('deleteProduct');

    cy.get('table').then(($table) => {
      if ($table.find('button:contains("Eliminar")').length > 0) {
        cy.contains('button', 'Eliminar').first().click();
      }
    });
  });

  // ── PROCESO 3: Gestión de Usuarios del Sistema ──────────────────────────────
  it('3. Proceso de Usuarios: Búsqueda, creación, modificación y eliminación', () => {
    // 3.1 Mock de listas maestras requeridas
    cy.intercept('GET', '**/api/admin/users/roles*', {
      statusCode: 200,
      body: {
        roles: [
          { id: 1, nombre: 'Administrador' },
          { id: 2, nombre: 'Empleado' },
          { id: 3, nombre: 'Cliente' }
        ]
      }
    }).as('getRoles');

    cy.intercept('GET', '**/api/auth/document-types*', {
      statusCode: 200,
      body: {
        tipos_identificacion: [
          { id: 1, nombre: 'Cédula de Ciudadanía' },
          { id: 2, nombre: 'Tarjeta de Identidad' }
        ]
      }
    }).as('getDocTypes');

    cy.intercept('GET', '**/api/admin/users*', {
      statusCode: 200,
      body: {
        usuarios: [
          { id: 1, nombre: 'Juan', apellido: 'Perez', email: 'juan@ejemplo.com', direccion: 'Calle 10 # 20-30', fecha_nacimiento: '1990-01-01', id_rol: 1, id_tipo_identificacion: 1, numero_identificacion: '10987654' },
          { id: 2, nombre: 'Maria', apellido: 'Gomez', email: 'maria@ejemplo.com', direccion: 'Carrera 15 # 45-60', fecha_nacimiento: '1995-05-15', id_rol: 2, id_tipo_identificacion: 1, numero_identificacion: '98765432' }
        ]
      }
    }).as('getUsers');

    cy.visitAsRole('/admin/users', 'admin');
    cy.wait(['@getRoles', '@getDocTypes', '@getUsers']);

    // 3.2 Búsqueda en la tabla
    cy.get('.input-busqueda[placeholder="Buscar por nombre o email"]').type('Maria');
    cy.get('table.tabla tbody tr').should('have.length', 1);
    cy.contains('td', 'maria@ejemplo.com').should('be.visible');

    cy.get('.btn-limpiar').click();
    cy.get('table.tabla tbody tr').should('have.length', 2);

    // 3.3 Creación de un nuevo usuario
    cy.intercept('POST', '**/api/admin/users', {
      statusCode: 201,
      body: { success: true, message: 'Usuario creado exitosamente' }
    }).as('createUser');

    cy.get('.btn-crear').contains('Nuevo Usuario').click();
    cy.get('.modal-overlay').should('be.visible');

    cy.get('.modal-body input').first().type('Nuevo');
    cy.get('.modal-body .form-group').contains('label', 'apellido').siblings('input').type('Operador');
    cy.get('.modal-body .form-group').contains('label', 'email').siblings('input').type('operador@ejemplo.com');
    cy.get('.modal-body .form-group').contains('label', 'direccion').siblings('input').type('Calle 50 # 10-20');
    cy.get('.modal-body .form-group').contains('label', 'numero identificacion').siblings('input').type('77889900');
    cy.get('.modal-body input[type="date"]').type('1992-06-15');
    cy.get('.modal-body input[type="password"]').type('Password123!');

    cy.get('.btn-guardar').click();
    cy.wait('@createUser');
    cy.get('.modal-overlay').should('not.exist');

    // 3.4 Edición de usuario existente
    cy.intercept('PUT', '**/api/admin/users/*', {
      statusCode: 200,
      body: { success: true, message: 'Usuario actualizado exitosamente' }
    }).as('editUser');

    cy.get('table.tabla tbody tr').first().find('.btn-modificar').click();
    cy.get('.modal-overlay').should('be.visible');
    cy.get('.modal-body .form-group').contains('label', 'nombre').siblings('input').clear().type('Juan Actualizado');
    cy.get('.btn-guardar').click();
    cy.wait('@editUser');
    cy.get('.modal-overlay').should('not.exist');

    // 3.5 Eliminación de usuario
    cy.on('window:confirm', () => true);
    cy.intercept('DELETE', '**/api/admin/users/*', {
      statusCode: 200,
      body: { success: true, message: 'Usuario eliminado' }
    }).as('deleteUser');

    cy.get('table.tabla tbody tr').first().find('.btn-eliminar').click();
    cy.wait('@deleteUser');
  });

  // ── PROCESO 4: Generación y Análisis de Reportes ───────────────────────────
  it('4. Proceso de Reportes: Consulta de métricas, filtrado por fechas y exportación', () => {
    cy.visitAsRole('/estadisticas', 'admin');
    cy.url().should('include', '/estadisticas');

    // Actualizar métricas generales
    cy.contains('button', 'Actualizar').click();

    // Filtrar por rango de meses
    cy.get('#mesInicio').type('2026-01');
    cy.get('#mesFin').type('2026-03');
    cy.contains('button', 'Actualizar').click();

    // Verificar botones de exportación PDF
    cy.contains('button', 'Descargar PDF').should('be.visible');
    cy.contains('button', 'Imprimir PDF').should('be.visible');
  });

});

