const request = require('supertest');
const express = require('express');

describe('Pruebas de Integración - Mock API de Ventas', () => {
  let app;

  const tokenCliente = 'mock-cliente-jwt-token-abc';

  let productsDb = [
    { id: 1, nombre: 'Arroz 1kg', precio: 3500, id_categoria: 1, categoria: 'Abarrotes', descripcion: 'Arroz premium', estado: 'Disponible', stock: 5 },
    { id: 2, nombre: 'Leche 1L', precio: 4200, id_categoria: 2, categoria: 'Lacteos', descripcion: 'Leche entera', estado: 'Disponible', stock: 3 },
    { id: 3, nombre: 'Café 250g', precio: 6800, id_categoria: 1, categoria: 'Abarrotes', descripcion: 'Café molido', estado: 'Disponible', stock: 4 },
    { id: 4, nombre: 'Queso 500g', precio: 9300, id_categoria: 2, categoria: 'Lacteos', descripcion: 'Queso fresco', estado: 'Disponible', stock: 2 },
    { id: 5, nombre: 'Producto inactivo', precio: 5000, id_categoria: 1, categoria: 'Abarrotes', descripcion: 'No disponible para venta', estado: 'Deshabilitado', stock: 0 },
    { id: 6, nombre: 'Sin stock', precio: 4400, id_categoria: 2, categoria: 'Lacteos', descripcion: 'Producto agotado', estado: 'Disponible', stock: 0 },
  ];

  let cartDb = [];
  let salesDb = [];

  const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || authHeader !== `Bearer ${tokenCliente}`) {
      return res.status(401).json({ success: false, message: 'No autorizado o token ausente' });
    }

    return next();
  };

  const getCartSummary = () => {
    const items = cartDb.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: Number((item.price * item.quantity).toFixed(2)),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = Number((subtotal * 0.19).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    return { items, subtotal, tax, total, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.get('/api/sales/products', requireAuth, (req, res) => {
      const search = (req.query.search || '').toString().trim().toLowerCase();
      const category = (req.query.category || 'todas').toString().trim().toLowerCase();
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const precioMin = Number(req.query.precioMin || NaN);
      const precioMax = Number(req.query.precioMax || NaN);

      const filtered = productsDb.filter((product) => {
        if (product.estado !== 'Disponible') return false;
        if (product.stock <= 0) return false;

        const text = `${product.nombre} ${product.descripcion}`.toLowerCase();
        if (search && !text.includes(search)) return false;

        if (category !== 'todas') {
          const categoryMatch = product.categoria.toLowerCase() === category || String(product.id_categoria) === category;
          if (!categoryMatch) return false;
        }

        if (!Number.isNaN(precioMin) && product.precio < precioMin) return false;
        if (!Number.isNaN(precioMax) && product.precio > precioMax) return false;

        return true;
      });

      const paginated = filtered.slice((page - 1) * limit, page * limit);

      return res.json({
        items: paginated.map((product) => ({
          id: String(product.id),
          nombre: product.nombre,
          precio: product.precio,
          id_categoria: product.id_categoria,
          categoria: product.categoria,
          descripcion: product.descripcion,
          estado: product.estado,
          stock: product.stock,
        })),
        page,
        limit,
        total: filtered.length,
      });
    });

    app.get('/api/sales/categories', requireAuth, (req, res) => {
      const categories = [...new Map(productsDb
        .filter((product) => product.estado === 'Disponible' && product.stock > 0)
        .map((product) => [product.id_categoria, { id: product.id_categoria, nombre: product.categoria }]))
        .values()];

      return res.json(categories);
    });

    app.get('/api/sales/payment-methods', requireAuth, (req, res) => {
      return res.json([
        { id: 'M1', nombre: 'Efectivo' },
        { id: 'M2', nombre: 'Tarjeta de Credito' },
        { id: 'M3', nombre: 'Tarjeta de Debito' },
      ]);
    });

    app.get('/api/cart', requireAuth, (req, res) => {
      const summary = getCartSummary();
      if (summary.items.length === 0) {
        return res.json({ items: [], subtotal: 0, tax: 0, total: 0, itemCount: 0, message: 'Tu carrito está vacío' });
      }

      return res.json(summary);
    });

    app.post('/api/cart/items', requireAuth, (req, res) => {
      const { productId, quantity } = req.body;
      if (!productId || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
        return res.status(400).json({ success: false, message: 'Datos de carrito inválidos' });
      }

      const product = productsDb.find((item) => Number(item.id) === Number(productId));
      if (!product) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }

      if (product.estado !== 'Disponible') {
        return res.status(409).json({ success: false, message: 'Producto no disponible para la venta' });
      }

      const qty = Number(quantity);
      if (qty > product.stock) {
        return res.status(409).json({ success: false, message: 'Stock insuficiente para el producto' });
      }

      const existing = cartDb.find((item) => Number(item.productId) === Number(productId));
      if (existing) {
        existing.quantity += qty;
        return res.status(201).json({ success: true, item: existing });
      }

      const item = {
        id: cartDb.length + 1,
        productId: Number(productId),
        name: product.nombre,
        quantity: qty,
        price: product.precio,
      };
      cartDb.push(item);
      return res.status(201).json({ success: true, item });
    });

    app.patch('/api/cart/items/:id', requireAuth, (req, res) => {
      const itemId = Number(req.params.id);
      const quantity = Number(req.body.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a cero' });
      }

      const item = cartDb.find((entry) => entry.id === itemId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item no encontrado en el carrito' });
      }

      const product = productsDb.find((p) => Number(p.id) === Number(item.productId));
      if (quantity > product.stock) {
        return res.status(409).json({ success: false, message: 'Stock insuficiente para la cantidad solicitada' });
      }

      item.quantity = quantity;
      return res.json({ success: true, item });
    });

    app.delete('/api/cart/items/:id', requireAuth, (req, res) => {
      const itemId = Number(req.params.id);
      const index = cartDb.findIndex((item) => item.id === itemId);

      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Item no encontrado en el carrito' });
      }

      cartDb.splice(index, 1);
      return res.json({ success: true, message: 'Producto eliminado del carrito' });
    });

    app.post('/api/sales/orders', requireAuth, (req, res) => {
      const { items = [], total, id_metodo } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Debe incluir al menos un producto' });
      }

      const metodo = id_metodo || 'M1';
      if (!['M1', 'M2', 'M3'].includes(metodo)) {
        return res.status(400).json({ success: false, message: 'Método de pago no válido' });
      }

      for (const item of items) {
        const product = productsDb.find((p) => Number(p.id) === Number(item.id));
        if (!product) {
          return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        if (product.estado !== 'Disponible') {
          return res.status(409).json({ success: false, message: 'Producto no disponible para la venta' });
        }

        const cantidad = Number(item.cantidad);
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a cero' });
        }

        if (cantidad > product.stock) {
          return res.status(409).json({ success: false, message: 'Stock insuficiente para el producto' });
        }
      }

      const computedTotal = items.reduce((sum, item) => {
        const product = productsDb.find((p) => Number(p.id) === Number(item.id));
        return sum + (product.precio * Number(item.cantidad));
      }, 0);

      if (Number(total) !== computedTotal) {
        return res.status(400).json({ success: false, message: 'Los totales enviados no coinciden con los calculados por el servidor' });
      }

      items.forEach((item) => {
        const product = productsDb.find((p) => Number(p.id) === Number(item.id));
        product.stock -= Number(item.cantidad);
      });

      const ticketId = `TCK-${String(salesDb.length + 1).padStart(4, '0')}`;
      salesDb.push({ id: salesDb.length + 1, ticketId, metodo, items, total: computedTotal });
      cartDb = [];

      return res.status(201).json({
        success: true,
        message: 'Venta registrada con exito',
        ticketId,
        total: computedTotal,
        metodo,
      });
    });
  });

  beforeEach(() => {
    productsDb = [
      { id: 1, nombre: 'Arroz 1kg', precio: 3500, id_categoria: 1, categoria: 'Abarrotes', descripcion: 'Arroz premium', estado: 'Disponible', stock: 5 },
      { id: 2, nombre: 'Leche 1L', precio: 4200, id_categoria: 2, categoria: 'Lacteos', descripcion: 'Leche entera', estado: 'Disponible', stock: 3 },
      { id: 3, nombre: 'Café 250g', precio: 6800, id_categoria: 1, categoria: 'Abarrotes', descripcion: 'Café molido', estado: 'Disponible', stock: 4 },
      { id: 4, nombre: 'Queso 500g', precio: 9300, id_categoria: 2, categoria: 'Lacteos', descripcion: 'Queso fresco', estado: 'Disponible', stock: 2 },
      { id: 5, nombre: 'Producto inactivo', precio: 5000, id_categoria: 1, categoria: 'Abarrotes', descripcion: 'No disponible para venta', estado: 'Deshabilitado', stock: 0 },
      { id: 6, nombre: 'Sin stock', precio: 4400, id_categoria: 2, categoria: 'Lacteos', descripcion: 'Producto agotado', estado: 'Disponible', stock: 0 },
    ];
    cartDb = [];
    salesDb = [];
  });

  describe('Flujo de catálogo, carrito y checkout', () => {
    it('CP-071: el catálogo debe cargar productos activos con stock para un cliente autenticado', async () => {
      const res = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ search: '', category: 'todas' });

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items.some((product) => product.id === '1')).toBe(true);
      expect(res.body.items.some((product) => product.id === '5')).toBe(false);
    });

    it('CP-072: productos inactivos o sin stock no deben aparecer en el catálogo', async () => {
      const res = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      const ids = res.body.items.map((product) => String(product.id));
      expect(ids).not.toContain('5');
      expect(ids).not.toContain('6');
    });

    it('CP-073: la consulta del catálogo con token inválido debe rechazarse', async () => {
      const res = await request(app)
        .get('/api/sales/products')
        .set('Authorization', 'Bearer token-invalido');

      expect(res.status).toBe(401);
      expect(String(res.body.message || '')).toMatch(/no autorizado|token ausente/i);
    });

    it('CP-074: la paginación del catálogo debe devolver resultados consistentes por página', async () => {
      const page1 = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ page: 1, limit: 2 });

      const page2 = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ page: 2, limit: 2 });

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      expect(page1.body.items).toHaveLength(2);
      expect(page2.body.items).toHaveLength(2);
      expect(page1.body.items[0].id).not.toBe(page2.body.items[0].id);
    });

    it('CP-075: el catálogo debe aplicar filtros por nombre, categoría y rango de precios', async () => {
      const byName = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ search: 'leche', category: 'todas' });

      const byCategory = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ category: 'lacteos' });

      const byPrice = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ precioMin: 3000, precioMax: 7000 });

      expect(byName.status).toBe(200);
      expect(byCategory.status).toBe(200);
      expect(byPrice.status).toBe(200);
      expect(byName.body.items.some((product) => product.nombre === 'Leche 1L')).toBe(true);
      expect(byCategory.body.items.every((product) => product.categoria === 'Lacteos')).toBe(true);
      expect(byPrice.body.items.every((product) => product.precio >= 3000 && product.precio <= 7000)).toBe(true);
    });

    it('CP-076: la búsqueda por nombre debe devolver solo coincidencias', async () => {
      const res = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ search: 'arroz' });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].nombre).toBe('Arroz 1kg');
    });

    it('CP-077: el filtro por categoría debe restringir resultados', async () => {
      const res = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ category: 'abarrotes' });

      expect(res.status).toBe(200);
      expect(res.body.items.every((product) => product.categoria === 'Abarrotes')).toBe(true);
    });

    it('CP-078: el filtro por rango de precios debe devolver solo productos dentro del rango', async () => {
      const res = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ precioMin: 6000, precioMax: 10000 });

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items.every((product) => product.precio >= 6000 && product.precio <= 10000)).toBe(true);
    });

    it('CP-079: cuando no hay coincidencias se debe devolver una respuesta vacía sin errores', async () => {
      const res = await request(app)
        .get('/api/sales/products')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .query({ search: 'producto inexistente' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items).toHaveLength(0);
    });

    it('CP-080: si se intenta filtrar sin autenticación se debe rechazar la solicitud', async () => {
      const res = await request(app)
        .get('/api/sales/products')
        .query({ search: 'leche' });

      expect(res.status).toBe(401);
    });

    it('CP-081: un producto válido puede agregarse al carrito y actualizar el total', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.item.quantity).toBe(2);

      const cart = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(cart.status).toBe(200);
      expect(cart.body.itemCount).toBe(2);
      expect(cart.body.total).toBeGreaterThan(0);
    });

    it('CP-082: no se puede agregar un producto si la cantidad supera el stock disponible', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 99 });

      expect(res.status).toBe(409);
      expect(String(res.body.message || '')).toMatch(/stock|insuficiente/i);
    });

    it('CP-083: un producto inactivo no puede agregarse al carrito', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 5, quantity: 1 });

      expect(res.status).toBe(409);
      expect(String(res.body.message || '')).toMatch(/no disponible|disponible/i);
    });

    it('CP-084: si el producto ya existe en el carrito, la cantidad se incrementa sin duplicar registros', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 1 });

      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.item.quantity).toBe(3);
    });

    it('CP-085: los datos inválidos del carrito deben responder con 400', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 'abc', quantity: -1 });

      expect(res.status).toBe(400);
      expect(String(res.body.message || '')).toMatch(/inválidos|invalid|mayor a cero/i);
    });

    it('CP-086: el carrito debe mostrar productos, subtotales e impuestos correctamente', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 2 });

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 2, quantity: 1 });

      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(2);
      expect(Number(res.body.subtotal)).toBeGreaterThan(0);
      expect(Number(res.body.tax)).toBeGreaterThan(0);
      expect(Number(res.body.total)).toBeGreaterThan(Number(res.body.subtotal));
    });

    it('CP-087: el carrito vacío debe mostrar el mensaje correspondiente', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Tu carrito está vacío');
    });

    it('CP-088: el cálculo de subtotales, impuestos y total debe coincidir con los valores esperados', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 1 });

      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${tokenCliente}`);

      const expectedSubtotal = 3500;
      const expectedTax = Number((expectedSubtotal * 0.19).toFixed(2));
      const expectedTotal = Number((expectedSubtotal + expectedTax).toFixed(2));

      expect(Number(res.body.subtotal)).toBe(expectedSubtotal);
      expect(Number(res.body.tax)).toBe(expectedTax);
      expect(Number(res.body.total)).toBe(expectedTotal);
    });

    it('CP-089: acceder al carrito sin autenticación debe responder 401', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.status).toBe(401);
    });

    it('CP-091: la eliminación de un producto del carrito debe recalcular el total', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 2 });

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 2, quantity: 1 });

      const deleteRes = await request(app)
        .delete('/api/cart/items/1')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(deleteRes.status).toBe(200);
      const cart = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(cart.body.items.some((item) => item.productId === 1)).toBe(false);
      expect(cart.body.itemCount).toBe(1);
    });

    it('CP-092: al actualizar cantidades con stock insuficiente debe rechazarse', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 2, quantity: 1 });

      const res = await request(app)
        .patch('/api/cart/items/1')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ quantity: 99 });

      expect(res.status).toBe(409);
      expect(String(res.body.message || '')).toMatch(/stock|insuficiente/i);
    });

    it('CP-093: al actualizar una cantidad válida debe conservar el producto sin duplicarlo', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 1 });

      const res = await request(app)
        .patch('/api/cart/items/1')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.item.quantity).toBe(3);
    });

    it('CP-094: la actualización con datos inválidos debe responder con 400', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 1 });

      const res = await request(app)
        .patch('/api/cart/items/1')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ quantity: 0 });

      expect(res.status).toBe(400);
    });

    it('CP-095: un método de pago válido debe registrarse en la venta', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 1 });

      const res = await request(app)
        .post('/api/sales/orders')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ items: [{ id: 1, cantidad: 1 }], total: 3500, id_metodo: 'M2' });

      expect(res.status).toBe(201);
      expect(res.body.metodo).toBe('M2');
    });

    it('CP-096: si no se selecciona método de pago, debe asumirse Efectivo', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 1 });

      const res = await request(app)
        .post('/api/sales/orders')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ items: [{ id: 1, cantidad: 1 }], total: 3500 });

      expect(res.status).toBe(201);
      expect(res.body.metodo).toBe('M1');
    });

    it('CP-097: ingresar un método de pago no soportado debe devolver 400', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 1 });

      const res = await request(app)
        .post('/api/sales/orders')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ items: [{ id: 1, cantidad: 1 }], total: 3500, id_metodo: 'M99' });

      expect(res.status).toBe(400);
      expect(String(res.body.message || '')).toMatch(/metodo|método|válido/i);
    });

    it('CP-099: la confirmación exitosa de compra debe crear la venta y vaciar el carrito', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 1 });

      const res = await request(app)
        .post('/api/sales/orders')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ items: [{ id: 1, cantidad: 1 }], total: 3500, id_metodo: 'M1' });

      const cart = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${tokenCliente}`);

      expect(res.status).toBe(201);
      expect(cart.status).toBe(200);
      expect(cart.body.itemCount).toBe(0);
      expect(salesDb).toHaveLength(1);
    });

    it('CP-100: si el stock cambia antes del checkout, la compra no se procesa', async () => {
      productsDb[0].stock = 0;

      const res = await request(app)
        .post('/api/sales/orders')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ items: [{ id: 1, cantidad: 1 }], total: 3500, id_metodo: 'M1' });

      expect(res.status).toBe(409);
      expect(String(res.body.message || '')).toMatch(/stock|insuficiente/i);
    });

    it('CP-102: la confirmación de compra sin token debe rechazar la solicitud', async () => {
      const res = await request(app)
        .post('/api/sales/orders')
        .send({ items: [{ id: 1, cantidad: 1 }], total: 3500, id_metodo: 'M1' });

      expect(res.status).toBe(401);
    });

    it('CP-103: los totales enviados por el cliente deben validarse con el cálculo del servidor', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ productId: 1, quantity: 1 });

      const res = await request(app)
        .post('/api/sales/orders')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ items: [{ id: 1, cantidad: 1 }], total: 9999, id_metodo: 'M1' });

      expect(res.status).toBe(400);
      expect(String(res.body.message || '')).toMatch(/totales|coinciden|servidor/i);
    });
  });
});
