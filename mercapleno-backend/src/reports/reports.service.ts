import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { MysqlService } from '../common/database/mysql.service';

@Injectable()
export class ReportsService {
  constructor(private readonly db: MysqlService) {}

  async getVentasMes(inicio?: string, fin?: string) {
    let sql = `
      SELECT TO_CHAR(fecha, 'YYYY-MM') AS mes, SUM(total) AS total
      FROM venta
      WHERE 1 = 1
    `;
    const params: any[] = [];

    if (inicio) {
      sql += ` AND TO_CHAR(fecha, 'YYYY-MM') >= $${params.length + 1}`;
      params.push(inicio);
    }

    if (fin) {
      sql += ` AND TO_CHAR(fecha, 'YYYY-MM') <= $${params.length + 1}`;
      params.push(fin);
    }

    sql += " GROUP BY TO_CHAR(fecha, 'YYYY-MM') ORDER BY TO_CHAR(fecha, 'YYYY-MM')";

    const [rows] = await this.db.query(sql, params);
    return rows;
  }

  async getTopProductos() {
    const sql = `
      SELECT p.nombre,
             COALESCE(c.nombre, 'General') AS categoria,
             SUM(vp.cantidad) AS total_vendido,
             SUM(vp.cantidad * vp.precio) AS total_facturado
      FROM venta_productos vp
      JOIN productos p ON p.id_productos = vp.id_productos
      LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
      GROUP BY p.nombre, c.nombre
      ORDER BY total_vendido DESC
      LIMIT 10
    `;

    const [rows] = await this.db.query(sql);
    return rows;
  }

  async getResumen() {
    const [[row]] = await this.db.query<any>(`
      SELECT COUNT(*) AS total_ventas,
             CAST(SUM(COALESCE(total, 0)) AS DECIMAL(12,2)) AS dinero_total,
             CAST(AVG(COALESCE(total, 0)) AS DECIMAL(12,2)) AS promedio
      FROM venta
    `);

    return row || { total_ventas: 0, dinero_total: 0, promedio: 0 };
  }

  async getResumenMes() {
    const [rows] = await this.db.query(`
      SELECT TO_CHAR(fecha, 'YYYY-MM') AS mes,
             COUNT(*) AS cantidad_ventas,
             CAST(SUM(total) AS DECIMAL(12,2)) AS total_mes
      FROM venta
      GROUP BY TO_CHAR(fecha, 'YYYY-MM')
      ORDER BY TO_CHAR(fecha, 'YYYY-MM') DESC
    `);

    return rows;
  }

  async getFinancialSummary(inicio?: string, fin?: string) {
    let dateFilter = '';
    const params: any[] = [];

    if (inicio) {
      dateFilter += ` AND v.fecha >= $${params.length + 1}::date`;
      params.push(inicio);
    }
    if (fin) {
      dateFilter += ` AND v.fecha <= $${params.length + 1}::date`;
      params.push(fin);
    }

    // 1. Resumen de ventas y costos
    const sqlVentas = `
      WITH costos_promedio AS (
        SELECT id_productos, AVG(costo_unitario) AS costo_promedio
        FROM entrada_productos
        GROUP BY id_productos
      )
      SELECT 
        COUNT(DISTINCT v.id_venta) AS total_ventas,
        COALESCE(SUM(v.total), 0) AS ingresos_totales,
        COALESCE(AVG(v.total), 0) AS ticket_promedio,
        COALESCE(SUM(vp.cantidad * COALESCE(cp.costo_promedio, vp.precio * 0.70)), 0) AS costo_estimado
      FROM venta v
      LEFT JOIN venta_productos vp ON vp.id_venta = v.id_venta
      LEFT JOIN costos_promedio cp ON cp.id_productos = vp.id_productos
      WHERE 1 = 1 ${dateFilter}
    `;

    const [[resVentas]] = await this.db.query<any>(sqlVentas, params);

    // 2. Valoración de inventario en bodega/stock
    const sqlInventario = `
      WITH costos_promedio AS (
        SELECT id_productos, AVG(costo_unitario) AS costo_promedio
        FROM entrada_productos
        GROUP BY id_productos
      )
      SELECT 
        COALESCE(SUM(sa.stock), 0) AS unidades_stock_total,
        COALESCE(SUM(sa.stock * p.precio), 0) AS valor_inventario_venta,
        COALESCE(SUM(sa.stock * COALESCE(cp.costo_promedio, p.precio * 0.70)), 0) AS valor_inventario_costo,
        COUNT(DISTINCT CASE WHEN sa.stock <= 5 THEN sa.id_productos END) AS productos_stock_bajo
      FROM stock_actual sa
      JOIN productos p ON p.id_productos = sa.id_productos
      LEFT JOIN costos_promedio cp ON cp.id_productos = p.id_productos
    `;

    const [[resInventario]] = await this.db.query<any>(sqlInventario);

    const ingresosTotales = Number(resVentas?.ingresos_totales || 0);
    const costoEstimado = Number(resVentas?.costo_estimado || 0);
    const gananciaBruta = Math.max(0, ingresosTotales - costoEstimado);
    const margenPct = ingresosTotales > 0 ? (gananciaBruta / ingresosTotales) * 100 : 0;
    const ticketPromedio = Number(resVentas?.ticket_promedio || 0);
    const totalVentas = Number(resVentas?.total_ventas || 0);

    return {
      ingresos_totales: ingresosTotales,
      costo_estimado: costoEstimado,
      ganancia_bruta: gananciaBruta,
      margen_porcentaje: Math.round(margenPct * 10) / 10,
      ticket_promedio: ticketPromedio,
      total_ventas: totalVentas,
      inventario: {
        unidades_stock_total: Number(resInventario?.unidades_stock_total || 0),
        valor_venta: Number(resInventario?.valor_inventario_venta || 0),
        valor_costo: Number(resInventario?.valor_inventario_costo || 0),
        productos_stock_bajo: Number(resInventario?.productos_stock_bajo || 0),
      },
    };
  }

  async getVentasPorCategoria() {
    const sql = `
      SELECT 
        COALESCE(c.nombre, 'Sin Categoria') AS categoria,
        COALESCE(SUM(vp.cantidad), 0) AS unidades_vendidas,
        COALESCE(SUM(vp.cantidad * vp.precio), 0) AS total_ingresos
      FROM venta_productos vp
      JOIN productos p ON p.id_productos = vp.id_productos
      LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
      GROUP BY c.nombre
      ORDER BY total_ingresos DESC
    `;

    const [rows] = await this.db.query<any>(sql);
    return rows;
  }

  async getVentasPorMetodo() {
    const sql = `
      SELECT 
        COALESCE(m.metodo_pago, 'Efectivo / Caja') AS metodo,
        COUNT(v.id_venta) AS transacciones,
        COALESCE(SUM(v.total), 0) AS total_recaudado
      FROM venta v
      LEFT JOIN metodo m ON m.id_metodo = v.id_metodo
      GROUP BY m.metodo_pago
      ORDER BY total_recaudado DESC
    `;

    const [rows] = await this.db.query<any>(sql);
    return rows;
  }

  async getProductosRentabilidad() {
    const sql = `
      WITH costos_promedio AS (
        SELECT id_productos, AVG(costo_unitario) AS costo_promedio
        FROM entrada_productos
        GROUP BY id_productos
      )
      SELECT 
        p.id_productos,
        p.nombre,
        COALESCE(c.nombre, 'General') AS categoria,
        SUM(vp.cantidad) AS unidades_vendidas,
        SUM(vp.cantidad * vp.precio) AS total_facturado,
        SUM(vp.cantidad * (vp.precio - COALESCE(cp.costo_promedio, vp.precio * 0.70))) AS ganancia_total,
        CASE 
          WHEN SUM(vp.cantidad * vp.precio) > 0 
          THEN ROUND((SUM(vp.cantidad * (vp.precio - COALESCE(cp.costo_promedio, vp.precio * 0.70))) / SUM(vp.cantidad * vp.precio)) * 100, 1)
          ELSE 0 
        END AS margen_pct
      FROM venta_productos vp
      JOIN productos p ON p.id_productos = vp.id_productos
      LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
      LEFT JOIN costos_promedio cp ON cp.id_productos = p.id_productos
      GROUP BY p.id_productos, p.nombre, c.nombre, cp.costo_promedio
      ORDER BY ganancia_total DESC
      LIMIT 10
    `;

    const [rows] = await this.db.query<any>(sql);
    return rows;
  }

  async buildResumenPdf(): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

    const formatCurrency = (value: unknown) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(value) || 0);

    const now = new Date();
    const fecha = now.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Encabezado
    doc.rect(0, 0, doc.page.width, 95).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('MERCAPLENO', 40, 26);
    doc.fontSize(12).font('Helvetica').text('Informe Ejecutivo & Rendimiento Financiero', 40, 52);
    doc.fontSize(9).fillColor('#94a3b8').text(`Fecha de emision: ${fecha}`, 40, 70);

    const financial = await this.getFinancialSummary();
    const topRentables = await this.getProductosRentabilidad();
    const ventasCat = await this.getVentasPorCategoria();
    const resumenMes = await this.getResumenMes();

    // Cajas de KPIs Financieros
    const summaryY = 115;
    const boxWidth = 120;
    const boxHeight = 55;
    const gap = 12;
    const boxes = [
      { title: 'Ingresos Totales', value: formatCurrency(financial.ingresos_totales), color: '#0ea5e9' },
      { title: 'Ganancia Bruta', value: formatCurrency(financial.ganancia_bruta), color: '#16a34a' },
      { title: 'Margen Rentabilidad', value: `${financial.margen_porcentaje}%`, color: '#8b5cf6' },
      { title: 'Ticket Promedio', value: formatCurrency(financial.ticket_promedio), color: '#f59e0b' },
    ];

    boxes.forEach((box, index) => {
      const x = 40 + index * (boxWidth + gap);
      doc.roundedRect(x, summaryY, boxWidth, boxHeight, 8).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(box.title.toUpperCase(), x + 10, summaryY + 10);
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(String(box.value), x + 10, summaryY + 28);
    });

    // Sub-tarjeta de Valor de Inventario
    const invY = summaryY + boxHeight + 12;
    doc.roundedRect(40, invY, doc.page.width - 80, 32, 6).fillAndStroke('#f1f5f9', '#cbd5e1');
    doc.fillColor('#334155').fontSize(9).font('Helvetica').text(
      `Valor de Inventario en Bodega: ${formatCurrency(financial?.inventario?.valor_venta)}  |  Total Unidades en Stock: ${financial?.inventario?.unidades_stock_total ?? 0}  |  Productos con Stock Critico: ${financial?.inventario?.productos_stock_bajo ?? 0}`,
      52,
      invY + 10,
    );

    // Sección Top Productos Rentables
    let currentY = invY + 48;
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Top 5 Productos por Rentabilidad (Utilidad Generada)', 40, currentY);
    currentY += 16;
    doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).stroke('#e2e8f0');
    currentY += 8;

    const colX = [40, 230, 320, 420, 480];
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
    doc.text('PRODUCTO', colX[0], currentY);
    doc.text('CATEGORIA', colX[1], currentY);
    doc.text('UNIDADES', colX[2], currentY, { width: 60, align: 'right' });
    doc.text('FACTURADO', colX[3], currentY, { width: 80, align: 'right' });
    doc.text('GANANCIA', colX[4], currentY, { width: 75, align: 'right' });
    currentY += 12;
    doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).stroke('#e2e8f0');
    currentY += 6;

    doc.fontSize(9).font('Helvetica').fillColor('#0f172a');
    if (topRentables.length === 0) {
      doc.text('No hay datos de productos registrados.', 40, currentY);
      currentY += 16;
    } else {
      topRentables.slice(0, 5).forEach((item: any) => {
        doc.text(item.nombre || 'Producto', colX[0], currentY, { width: 180 });
        doc.text(item.categoria || 'General', colX[1], currentY, { width: 80 });
        doc.text(String(item.unidades_vendidas || 0), colX[2], currentY, { width: 60, align: 'right' });
        doc.text(formatCurrency(item.total_facturado), colX[3], currentY, { width: 80, align: 'right' });
        doc.text(formatCurrency(item.ganancia_total), colX[4], currentY, { width: 75, align: 'right' });
        currentY += 15;
      });
    }

    // Sección Ventas por Categoría y Evolución Mensual (2 Columnas)
    currentY += 12;
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Participacion por Categoria & Historico Mensual', 40, currentY);
    currentY += 16;
    doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).stroke('#e2e8f0');
    currentY += 8;

    // Columna 1: Categorías
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
    doc.text('CATEGORIA', 40, currentY);
    doc.text('TOTAL', 180, currentY, { width: 80, align: 'right' });

    // Columna 2: Meses
    doc.text('MES', 300, currentY);
    doc.text('VENTAS', 400, currentY, { width: 50, align: 'right' });
    doc.text('TOTAL', 460, currentY, { width: 95, align: 'right' });

    currentY += 12;
    doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).stroke('#e2e8f0');
    currentY += 6;

    const maxRows = Math.max(ventasCat.length, resumenMes.length, 1);
    doc.fontSize(9).font('Helvetica').fillColor('#0f172a');

    for (let i = 0; i < Math.min(maxRows, 6); i++) {
      const cat = ventasCat[i];
      const mes = resumenMes[i];

      if (cat) {
        doc.text(cat.categoria, 40, currentY, { width: 140 });
        doc.text(formatCurrency(cat.total_ingresos), 180, currentY, { width: 80, align: 'right' });
      }

      if (mes) {
        doc.text(mes.mes, 300, currentY, { width: 90 });
        doc.text(String(mes.cantidad_ventas), 400, currentY, { width: 50, align: 'right' });
        doc.text(formatCurrency(mes.total_mes), 460, currentY, { width: 95, align: 'right' });
      }

      currentY += 15;
    }

    // Pie de página
    doc.rect(40, doc.page.height - 40, doc.page.width - 80, 1).fill('#e2e8f0');
    doc.fontSize(8).fillColor('#94a3b8').text(
      'Mercapleno - Sistema de Administracion y Punto de Venta | Documento confidencial generado automaticamente',
      40,
      doc.page.height - 30,
      { align: 'center' },
    );

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
