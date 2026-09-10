// ***********************************************************
// support/e2e.js - cargado automaticamente antes de cada spec
// ***********************************************************
import './commands'

beforeEach(() => {
  // Default mock for product catalogs to prevent disabled selects when backend is offline
  cy.intercept('GET', '**/api/productos/catalogos*', {
    statusCode: 200,
    body: {
      categorias: [
        { id: 1, nombre: 'Lácteos' },
        { id: 2, nombre: 'Bebidas' },
        { id: 3, nombre: 'Abarrotes' }
      ],
      proveedores: [
        { id: 1, nombre: 'Proveedor Central' },
        { id: 2, nombre: 'Distribuidora Norte' }
      ]
    }
  }).as('defaultCatalogs');

  // Default mock for admin products list
  cy.intercept('GET', '**/api/productos*', (req) => {
    if (!req.url.includes('catalogos')) {
      req.reply({
        statusCode: 200,
        body: [
          {
            id_productos: 1,
            nombre: 'Helado Artesanal Vainilla',
            precio: 4500,
            id_categoria: 1,
            categoria_nombre: 'Lácteos',
            id_proveedor: 1,
            proveedor_nombre: 'Proveedor Central',
            estado: 'Disponible',
            descripcion: 'Helado premium de vainilla',
            imagen: null
          }
        ]
      });
    }
  }).as('defaultProducts');
});
