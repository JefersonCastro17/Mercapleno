import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PoolConnection } from 'mysql2/promise';
import { MysqlService } from '../common/database/mysql.service';
import { buildLowStockAlert, getLowStockMetadata, LowStockAlert } from '../common/stock/low-stock.util';
import { EmailService } from '../email/email.service';
import { RegisterMovementDto } from './dto/register-movement.dto';

type MovementType = 'ENTRADA' | 'SALIDA';

type SqlQueryExecutor = {
  query(sql: string, params?: any[]): Promise<[any, any]>;
};

type ReferenceDocumentOption = {
  id_documento: string;
  label: string;
  total_usos: number;
};

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly db: MysqlService,
    private readonly emailService: EmailService,
  ) {}

  async getProductsWithStock() {
    const sql = `
      SELECT p.id_productos AS id, p.nombre, p.precio, p.imagen,
             c.nombre AS categoria, COALESCE(s.stock, 0) AS stock
      FROM productos p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN stock_actual s ON p.id_productos = s.id_productos
      WHERE LOWER(TRIM(COALESCE(p.estado, ''))) NOT IN ('deshabilitado', 'no disponible', 'no-disponible')
      ORDER BY p.nombre ASC
    `;

    const [rows] = await this.db.query<any[]>(sql);
    return rows.map((row: any) => {
      const stock = Number(row.stock || 0);
      const precio = Number(row.precio || 0);

      return {
        ...row,
        precio: Number.isFinite(precio) ? precio : 0,
        stock,
        ...getLowStockMetadata(stock),
      };
    });
  }

  async getReferenceDocuments(tipoMovimiento?: MovementType) {
    return this.fetchReferenceDocuments(this.db, tipoMovimiento);
  }

  async registerMovement(dto: RegisterMovementDto, userId?: number) {
    const id_mov_db = dto.tipo_movimiento === 'ENTRADA' ? 2 : 3;
    const id_usuario = Number.isFinite(Number(userId)) ? Number(userId) : 1;
    const normalizedDocumentId = this.normalizeReferenceDocumentId(dto.id_documento) || 'ND';

    let connection: PoolConnection | null = null;
    let lowStockAlert: LowStockAlert | null = null;

    try {
      connection = await this.db.getConnection();
      await connection.beginTransaction();
      await this.ensureReferenceDocumentExists(connection, dto.tipo_movimiento, normalizedDocumentId);

      // Paso 1: Registrar el movimiento maestro
      const descripcionMovimiento = dto.comentario || (dto.tipo_movimiento === 'ENTRADA' ? 'Entrada de producto por inventario' : 'Salida de producto por inventario');
      const [movimientoResult] = await connection.execute(
        `
          INSERT INTO movimiento (id_tipo, descripcion, fecha_generar)
          VALUES (?, ?, NOW())
        `,
        [id_mov_db, descripcionMovimiento],
      );
      const idMovimientoGenerado = (movimientoResult as any).insertId;

      if (dto.tipo_movimiento === 'ENTRADA') {
        // Paso 2: Registrar en entrada_productos usando el ID dinámico
        await connection.execute(
          `
            INSERT INTO entrada_productos
            (id_productos, cantidad, fecha, observaciones, id_documento, id_usuario, id_movimiento)
            VALUES (?, ?, NOW(), ?, ?, ?, ?)
          `,
          [dto.id_producto, dto.cantidad, dto.comentario || null, normalizedDocumentId, id_usuario, idMovimientoGenerado],
        );

        // Paso 3: Actualizar stock_actual con la cantidad y el ID del movimiento
        const [updateResult] = await connection.execute(
          'UPDATE stock_actual SET stock = stock + ?, id_movimiento = ?, fecha_vencimiento = CURDATE() WHERE id_productos = ?',
          [dto.cantidad, idMovimientoGenerado, dto.id_producto],
        );

        if ((updateResult as { affectedRows?: number }).affectedRows === 0) {
          await connection.execute(
            'INSERT INTO stock_actual (id_productos, stock, id_movimiento, fecha_vencimiento) VALUES (?, ?, ?, CURDATE())',
            [dto.id_producto, dto.cantidad, idMovimientoGenerado],
          );
        }
      } else {
        const [[stockRow]] = await connection.query<any[]>(
          'SELECT stock FROM stock_actual WHERE id_productos = ? FOR UPDATE',
          [dto.id_producto],
        );

        if (!stockRow || stockRow.stock < dto.cantidad) {
          throw new BadRequestException({ error: 'Stock insuficiente para registrar salida' });
        }

        // Paso 2: Registrar en salida_productos usando el ID dinámico
        await connection.execute(
          `
            INSERT INTO salida_productos
            (id_productos, cantidad, fecha, id_documento, id_usuario, id_movimiento)
            VALUES (?, ?, NOW(), ?, ?, ?)
          `,
          [dto.id_producto, dto.cantidad, normalizedDocumentId, id_usuario, idMovimientoGenerado],
        );

        // Paso 3: Actualizar stock_actual con la cantidad y el ID del movimiento
        const [updateResult] = await connection.execute(
          'UPDATE stock_actual SET stock = stock - ?, id_movimiento = ?, fecha_vencimiento = CURDATE() WHERE id_productos = ?',
          [dto.cantidad, idMovimientoGenerado, dto.id_producto],
        );

        if ((updateResult as { affectedRows?: number }).affectedRows === 0) {
          throw new BadRequestException({
            error: 'No existe un registro de stock para el producto seleccionado',
          });
        }
      }

      const stockSnapshot = await this.getStockSnapshot(connection, dto.id_producto);
      if (stockSnapshot) {
        lowStockAlert = buildLowStockAlert(stockSnapshot.id, stockSnapshot.stock, stockSnapshot.nombre);
      }

      await connection.commit();

      if (lowStockAlert) {
        this.logger.log(
          `Se detecto stock bajo para producto ${lowStockAlert.productId} tras movimiento. Se intentara notificar por correo.`,
        );
        await this.notifyLowStockAdmins([lowStockAlert], 'registro de movimiento de inventario');
      }

      return {
        message: 'Movimiento registrado con exito',
        ...(lowStockAlert ? { warning: lowStockAlert } : {}),
      };
    } catch (error) {
      await this.rollbackSafely(connection, 'registerMovement', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `No se pudo registrar el movimiento: ${this.describeError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({ error: 'No se pudo registrar el movimiento' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  private async getStockSnapshot(connection: PoolConnection, productId: number) {
    const [rows] = await connection.query<any[]>(
      `
        SELECT p.id_productos AS id, p.nombre, COALESCE(sa.stock, 0) AS stock
        FROM productos p
        LEFT JOIN stock_actual sa ON p.id_productos = sa.id_productos
        WHERE p.id_productos = ?
        LIMIT 1
      `,
      [productId],
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: Number(row.id),
      nombre: row.nombre ? String(row.nombre) : undefined,
      stock: Number(row.stock || 0),
    };
  }

  private async fetchReferenceDocuments(executor: SqlQueryExecutor, tipoMovimiento?: MovementType) {
    const normalizedType = this.normalizeMovementType(tipoMovimiento);
    const [rows] = await executor.query(
      `
        SELECT
          codigo AS id_documento,
          codigo AS label,
          SUM(total_usos) AS total_usos
        FROM (
          SELECT UPPER(TRIM(id_documento)) AS codigo, 'ENTRADA' AS tipo_movimiento, COUNT(*) AS total_usos
          FROM entrada_productos
          WHERE id_documento IS NOT NULL AND TRIM(id_documento) <> ''
          GROUP BY UPPER(TRIM(id_documento))

          UNION ALL

          SELECT UPPER(TRIM(id_documento)) AS codigo, 'SALIDA' AS tipo_movimiento, COUNT(*) AS total_usos
          FROM salida_productos
          WHERE id_documento IS NOT NULL AND TRIM(id_documento) <> ''
          GROUP BY UPPER(TRIM(id_documento))
        ) documentos
        WHERE (? IS NULL OR tipo_movimiento = ?)
        GROUP BY codigo
        ORDER BY codigo ASC
      `,
      [normalizedType, normalizedType],
    );

    return rows.map((row: any): ReferenceDocumentOption => ({
      id_documento: String(row.id_documento),
      label: String(row.label),
      total_usos: Number(row.total_usos || 0),
    }));
  }

  private async ensureReferenceDocumentExists(
    executor: SqlQueryExecutor,
    tipoMovimiento: MovementType,
    documentId: string,
  ) {
    // Se omite la validación de existencia previa para permitir el registro de cualquier código
    // de documento nuevo (evitando el error circular donde no se puede registrar un documento que no ha sido usado antes).
    return;
  }

  private normalizeMovementType(value?: string): MovementType | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toUpperCase();
    if (normalized === 'ENTRADA' || normalized === 'SALIDA') {
      return normalized;
    }

    return undefined;
  }

  private normalizeReferenceDocumentId(value?: string) {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim().toUpperCase();
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
