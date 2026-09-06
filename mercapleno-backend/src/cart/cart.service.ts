import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { MysqlService } from '../common/database/mysql.service';

@Injectable()
export class CartService {
  constructor(private readonly db: MysqlService) {}

  async ensureActiveCart(userId: number) {
    const [[existingCart]] = await this.db.query<any[]>(
      'SELECT id FROM cart WHERE id_usuario = ? AND status = ? LIMIT 1',
      [userId, 'active'],
    );

    if (existingCart?.id) {
      return existingCart.id;
    }

    const [result] = await this.db.query<any>(
      'INSERT INTO cart (id_usuario, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [userId, 'active'],
    );

    return result.insertId;
  }

  async getCart(userId: number) {
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    const cartId = await this.ensureActiveCart(userId);

    const [items] = await this.db.query<any[]>(
      `SELECT
         ci.id,
         ci.id_productos,
         ci.cantidad,
         ci.price_snapshot,
         p.nombre,
         COALESCE(SUM(sa.stock), 0) AS stock
       FROM cart_items ci
       JOIN productos p ON p.id_productos = ci.id_productos
       LEFT JOIN stock_actual sa ON sa.id_productos = p.id_productos
       WHERE ci.cart_id = ?
       GROUP BY ci.id, ci.id_productos, ci.cantidad, ci.price_snapshot, p.nombre
       ORDER BY ci.id ASC`,
      [cartId],
    );

    return (items || []).map((item: any) => ({
      id: item.id,
      productId: item.id_productos,
      name: item.nombre,
      quantity: item.cantidad,
      price: item.price_snapshot,
      stock: Number(item.stock || 0),
    }));
  }

  async getCartSum(userId: number) {
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    const [rows] = await this.db.query<any[]>(
      `
        SELECT
          ci.id,
          ci.id_productos AS productId,
          ci.cantidad,
          ci.price_snapshot,
          p.nombre,
          p.precio AS currentPrice,
          COALESCE((SELECT SUM(stock) FROM stock_actual sa WHERE sa.id_productos = p.id_productos), 0) AS availableStock
        FROM cart_items ci
        JOIN cart c ON c.id = ci.cart_id
        JOIN productos p ON p.id_productos = ci.id_productos
        WHERE c.id_usuario = ? AND c.status = 'active'
        ORDER BY ci.id ASC
      `,
      [userId],
    );

    const items = (rows || []).map((row: any) => {
      const quantity = Number(row.cantidad || 0);
      const priceSnapshot = Number(row.price_snapshot ?? row.pricesnapshot ?? 0);
      const currentPrice = Number(row.currentPrice ?? row.currentprice ?? row.precio ?? 0);
      const productId = Number(row.productId ?? row.productid ?? row.id_productos ?? 0);
      const availableStock = Number(row.availableStock ?? row.availablestock ?? row.stock ?? 0);

      return {
        id: Number(row.id),
        productId,
        name: String(row.nombre ?? 'Producto'),
        quantity,
        priceSnapshot,
        currentPrice,
        availableStock,
        priceChanged: priceSnapshot !== currentPrice,
        subtotal: Number((priceSnapshot * quantity).toFixed(2)),
      };
    });

    const subtotal = Number(items.reduce((sum: number, item: any) => sum + item.subtotal, 0).toFixed(2));
    const tax = Number((subtotal * 0.19).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    return {
      items,
      subtotal,
      tax,
      total,
      itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      warnings: items
        .filter((item: any) => item.availableStock < item.quantity)
        .map((item: any) => ({ productId: item.productId, available: item.availableStock })),
    };
  }

  async addItem(userId: number, body: { productId: number; quantity: number }) {
    const cartId = await this.ensureActiveCart(userId);
    const { productId, quantity } = body;
    const productIdNumber = Number(productId);
    const qty = Number(quantity);

    if (!Number.isInteger(productIdNumber) || productIdNumber <= 0 || !Number.isInteger(qty) || qty <= 0) {
      throw new BadRequestException('Datos de carrito invalidos');
    }

    const [[product]] = await this.db.query<any[]>(
      'SELECT precio, estado FROM productos WHERE id_productos = ? LIMIT 1',
      [productIdNumber],
    );

    if (!product) {
      throw new ConflictException('Producto no encontrado');
    }

    if (product.estado !== 'Disponible') {
      throw new ConflictException('Producto no disponible para la venta');
    }

    const [[stockRow]] = await this.db.query<any[]>(
      'SELECT COALESCE(SUM(stock), 0) AS stock FROM stock_actual WHERE id_productos = ?',
      [productIdNumber],
    );

    if (qty > Number(stockRow?.stock || 0)) {
      throw new ConflictException('Stock insuficiente para el producto');
    }

    const [[existing]] = await this.db.query<any[]>(
      'SELECT id, cantidad FROM cart_items WHERE cart_id = ? AND id_productos = ? LIMIT 1',
      [cartId, productIdNumber],
    );

    if (existing) {
      const newQty = existing.cantidad + qty;
      if (newQty > Number(stockRow?.stock || 0)) {
        throw new ConflictException('Stock insuficiente para el producto');
      }
      await this.db.query('UPDATE cart_items SET cantidad = ?, updated_at = NOW() WHERE id = ?', [newQty, existing.id]);
      return { id: existing.id, productId: productIdNumber, quantity: newQty };
    }

    const priceSnapshot = product.precio;
    const [result] = await this.db.query<any>(
      'INSERT INTO cart_items (cart_id, id_productos, cantidad, price_snapshot, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [cartId, productIdNumber, qty, priceSnapshot],
    );

    return { id: result.insertId, productId: productIdNumber, quantity: qty };
  }

  async updateItem(userId: number, itemId: number, body: { quantity: number }) {
    const qty = Number(body.quantity);
    if (qty <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a cero');
    }

    const sqlCheck = `SELECT ci.id, ci.id_productos, ci.cantidad FROM cart_items ci JOIN cart c ON c.id = ci.cart_id WHERE ci.id = ? AND c.id_usuario = ? AND c.status = 'active' LIMIT 1`;
    const [[item]] = await this.db.query<any[]>(sqlCheck, [itemId, userId]);

    if (!item) {
      throw new Error('Item no encontrado en el carrito activo');
    }

    const [[stockRow]] = await this.db.query<any[]>(
      'SELECT COALESCE(SUM(stock), 0) AS stock FROM stock_actual WHERE id_productos = ?',
      [item.id_productos],
    );

    if (qty > Number(stockRow?.stock || 0)) {
      throw new ConflictException('Stock insuficiente para la cantidad solicitada');
    }

    await this.db.query('UPDATE cart_items SET cantidad = ?, updated_at = NOW() WHERE id = ?', [qty, itemId]);
    return { id: itemId, productId: item.id_productos, quantity: qty };
  }

  async deleteItem(userId: number, itemId: number) {
    await this.db.query(
      'DELETE FROM cart_items WHERE id = ? AND cart_id IN (SELECT id FROM cart WHERE id_usuario = ? AND status = ?)',
      [itemId, userId, 'active'],
    );
    return { success: true };
  }

  async clearCart(userId: number) {
    const cartId = await this.ensureActiveCart(userId);
    await this.db.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    return { success: true };
  }
}
