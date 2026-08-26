import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PoolConnection } from 'mysql2/promise';
import { MysqlService } from '../common/database/mysql.service';
import { buildLowStockAlert, getLowStockMetadata, LowStockAlert } from '../common/stock/low-stock.util';
import { EmailService } from '../email/email.service';
import { CreateOrderDto } from './dto/create-order.dto';

const DOCUMENTO_VENTA_ID = 'CC';
const MOVIMIENTO_VENTA_ID = 3;

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly db: MysqlService,
    private readonly emailService: EmailService,
  ) {}

  private resolvePaymentMethod(value: unknown): string | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return `M${Math.trunc(value)}`;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toUpperCase();
    if (!normalized) {
      return null;
    }

    if (/^M\d+$/.test(normalized)) {
      return normalized;
    }

    if (/^\d+$/.test(normalized)) {
      return `M${normalized}`;
    }

    return normalized;
  }

  async getFilteredProducts(filters: {
    search?: string;
    category?: string;
    precioMin?: string;
    precioMax?: string;
  }) {
    let sql = `
      SELECT
        p.id_productos AS id,
        p.nombre,
        p.descripcion,
        p.precio,
        c.nombre AS category,
        p.imagen AS image,
        COALESCE(sa.stock, 0) AS stock
      FROM productos p
      LEFT JOIN stock_actual sa ON p.id_productos = sa.id_productos
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      WHERE p.estado = 'Disponible'
      AND COALESCE(sa.stock, 0) > 0
    `;

    const params: any[] = [];

    if (filters.category && filters.category !== 'todas') {
      sql += ' AND LOWER(c.nombre) = LOWER(?)';
      params.push(filters.category);
    }

    if (filters.search) {
      sql += ' AND p.nombre LIKE ?';
      params.push(`%${filters.search}%`);
    }

    const minValue = Number(filters.precioMin);
    if (!Number.isNaN(minValue)) {
      sql += ' AND p.precio >= ?';
      params.push(minValue);
    }

    const maxValue = Number(filters.precioMax);
    if (!Number.isNaN(maxValue)) {
      sql += ' AND p.precio <= ?';
      params.push(maxValue);
    }

    sql += ' ORDER BY p.nombre ASC';

    const [rows] = await this.db.query<any>(sql, params);
    return rows.map((row: any) => {
      const stock = Number(row.stock || 0);

      return {
        id: String(row.id),
        nombre: row.nombre,
        descripcion: row.descripcion || '',
        price: Number(row.precio),
        category: (row.category || 'otros').toLowerCase(),
        image: row.image,
        stock,
        ...getLowStockMetadata(stock),
      };
    });
  }

  async getAvailableCategories() {
    const sql = `
      SELECT
        c.nombre AS category,
        COUNT(p.id_productos) AS product_count
      FROM categoria c
      JOIN productos p ON c.id_categoria = p.id_categoria
      JOIN stock_actual sa ON p.id_productos = sa.id_productos
      WHERE sa.stock > 0
      GROUP BY c.nombre
      ORDER BY c.nombre
    `;

    const [rows] = await this.db.query<any>(sql);
    return rows.map((row: any) => ({
      value: String(row.category).toLowerCase(),
      label: String(row.category).charAt(0).toUpperCase() + String(row.category).slice(1),
      count: Number(row.product_count),
    }));
  }

  async getPaymentMethods() {
    const [rows] = await this.db.query<any[]>(
      'SELECT id_metodo, metodo_pago FROM metodo ORDER BY id_metodo ASC',
    );

    return (rows || []).map((row: any) => ({
      id_metodo: String(row.id_metodo),
      metodo_pago: String(row.metodo_pago ?? '').trim(),
      value: String(row.id_metodo),
      label: String(row.metodo_pago ?? row.id_metodo ?? 'Metodo de pago'),
    }));
  }

  async createOrder(dto: CreateOrderDto, userId?: number) {
    const idMetodo = this.resolvePaymentMethod(dto.id_metodo ?? dto.metodo_pago ?? 'M1');
    if (!idMetodo) {
      throw new BadRequestException({ error: 'Datos de orden incompletos o invalidos.' });
    }

    const idUsuario = Number.isFinite(Number(userId)) ? Number(userId) : 1;

    let connection: PoolConnection | null = null;
    const lowStockAlerts = new Map<number, LowStockAlert>();

    try {
      connection = await this.db.getConnection();
      await connection.beginTransaction();

      const [[metodo]] = await connection.query<any[]>(
        'SELECT id_metodo FROM metodo WHERE id_metodo = ? LIMIT 1',
        [idMetodo],
      );

      if (!metodo) {
        throw new BadRequestException({
          error: 'Metodo de pago invalido',
          message: `No existe el metodo de pago ${idMetodo}.`,
        });
      }

      let expectedTotal = 0;
      for (const item of dto.items) {
        const idProducto = Number(item.id);
        const [[producto]] = await connection.query<any[]>(
          'SELECT precio FROM productos WHERE id_productos = ? LIMIT 1',
          [idProducto],
        );

        if (!producto) {
          throw new ConflictException({
            error: 'Producto no encontrado',
            message: `No existe el producto ID ${idProducto}.`,
          });
        }

        expectedTotal += Number(producto.precio) * Number(item.cantidad);
      }

      if (Number(dto.total) !== expectedTotal) {
        throw new BadRequestException({
          error: 'Totales invalidos',
          message: 'Los totales enviados no coinciden con los calculados por el servidor.',
        });
      }

      const [ventaResult] = await connection.query<any>(
        `
          INSERT INTO venta (id_documento, id_usuario, id_metodo, fecha, total)
          VALUES (?, ?, ?, NOW(), ?)
        `,
        [DOCUMENTO_VENTA_ID, idUsuario, idMetodo, dto.total],
      );

      const idVenta = ventaResult.insertId;
      if (!idVenta) {
        throw new InternalServerErrorException('No se genero la venta');
      }

      for (const item of dto.items) {
        const idProducto = Number(item.id);
        const cantidad = Number(item.cantidad);

        const [[producto]] = await connection.query<any[]>(
          `
            SELECT p.nombre, p.precio, sa.stock
            FROM productos p
            JOIN stock_actual sa ON p.id_productos = sa.id_productos
            WHERE p.id_productos = ?
            FOR UPDATE
          `,
          [idProducto],
        );

        if (!producto || producto.stock < cantidad) {
          throw new ConflictException({
            error: 'Stock Insuficiente',
            message: `El producto ID ${idProducto} no tiene la cantidad solicitada disponible.`,
          });
        }

        await connection.query(
          `
            INSERT INTO venta_productos (id_venta, id_productos, cantidad, precio)
            VALUES (?, ?, ?, ?)
          `,
          [idVenta, idProducto, cantidad, producto.precio],
        );

        // Paso 1: Registrar el movimiento de salida por venta
        const [movimientoResult] = await connection.query(
          `
            INSERT INTO movimiento (id_tipo, descripcion, fecha_generar)
            VALUES (?, ?, NOW())
          `,
          [MOVIMIENTO_VENTA_ID, `Salida por venta ID: ${idVenta}`],
        );
        const idMovimientoGenerado = (movimientoResult as any).insertId;

        // Paso 2: Registrar en salida_productos usando el ID de movimiento generado
        await connection.query(
          `
            INSERT INTO salida_productos (id_productos, cantidad, fecha, id_documento, id_usuario, id_movimiento)
            VALUES (?, ?, NOW(), ?, ?, ?)
          `,
          [idProducto, cantidad, DOCUMENTO_VENTA_ID, idUsuario, idMovimientoGenerado],
        );

        // Paso 3: Actualizar stock y asociar el id_movimiento en stock_actual
        await connection.query(
          'UPDATE stock_actual SET stock = stock - ?, id_movimiento = ?, fecha_vencimiento = CURDATE() WHERE id_productos = ?',
          [cantidad, idMovimientoGenerado, idProducto],
        );

        const remainingStock = Number(producto.stock) - cantidad;
        const lowStockAlert = buildLowStockAlert(idProducto, remainingStock, producto.nombre);
        if (lowStockAlert) {
          lowStockAlerts.set(idProducto, lowStockAlert);
        }
      }

      await connection.commit();
      const warnings = Array.from(lowStockAlerts.values());

      if (warnings.length > 0) {
        this.logger.log(
          `Se detecto stock bajo para ${warnings.length} producto(s) tras venta. Se intentara notificar por correo.`,
        );
        await this.notifyLowStockAdmins(warnings, 'registro de venta');
      }

      return {
        message: 'Venta registrada con exito',
        ticketId: String(idVenta),
        total: dto.total,
        ...(warnings.length > 0 ? { warnings } : {}),
      };
    } catch (error) {
      await this.rollbackSafely(connection, 'createOrder', error);

      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(
        `No se pudo procesar la venta: ${this.describeError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        error: 'Error Interno del Servidor',
        message: 'Fallo al procesar la venta y actualizar el inventario.',
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  private async rollbackSafely(connection: PoolConnection | null, context: string, originalError: unknown) {
    if (!connection) {
      return;
    }

    try {
      await connection.rollback();
    } catch (rollbackError) {
      this.logger.warn(
        `No se pudo hacer rollback en ${context}. Error original: ${this.describeError(
          originalError,
        )}. Error de rollback: ${this.describeError(rollbackError)}`,
      );
    }
  }

  private describeError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Error desconocido';
    }
  }

  private async notifyLowStockAdmins(alerts: LowStockAlert[], source: string) {
    try {
      await this.emailService.sendLowStockAlertToAdmins(alerts, source);
    } catch (error) {
      this.logger.warn(`No se pudo enviar correo de stock bajo: ${this.describeError(error)}`);
    }
  }
}
