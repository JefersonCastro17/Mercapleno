import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { MysqlService } from '../common/database/mysql.service';

@Injectable()
export class ReportsService {
  constructor(private readonly db: MysqlService) {}

  async getVentasMes(inicio?: string, fin?: string) {
    let sql = `
      SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes, SUM(total) AS total
      FROM venta
      WHERE 1 = 1
    `;
    const params: any[] = [];

    if (inicio) {
      sql += ` AND DATE_FORMAT(fecha, '%Y-%m') >= ?`;
      params.push(inicio);
    }

    if (fin) {
      sql += ` AND DATE_FORMAT(fecha, '%Y-%m') <= ?`;
      params.push(fin);
    }

    sql += ' GROUP BY mes ORDER BY mes';

    const [rows] = await this.db.query(sql, params);
    return rows;
  }

  async getTopProductos() {
    const sql = `
      SELECT p.nombre,
             SUM(vp.cantidad) AS total_vendido,
             SUM(vp.cantidad * vp.precio) AS total_facturado
      FROM venta_productos vp
      JOIN productos p ON p.id_productos = vp.id_productos
      GROUP BY p.nombre
      ORDER BY total_vendido DESC
      LIMIT 10
    `;

    const [rows] = await this.db.query(sql);
    return rows;
  }

  async getResumen() {
    const [[row]] = await this.db.query<any>(`
      SELECT COUNT(*) AS total_ventas,
             CAST(SUM(COALESCE(total, 0)) AS DECIMAL(10,2)) AS dinero_total,
             CAST(AVG(COALESCE(total, 0)) AS DECIMAL(10,2)) AS promedio
      FROM venta
    `);

    return row;
  }

  async getResumenMes() {
    const [rows] = await this.db.query(`
      SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes,
             COUNT(*) AS cantidad_ventas,
             CAST(SUM(total) AS DECIMAL(10,2)) AS total_mes
      FROM venta
      GROUP BY mes
      ORDER BY mes DESC
    `);

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

    doc.rect(0, 0, doc.page.width, 90).fill('#0ea5e9');
    doc.fillColor('white').fontSize(22).text('Reporte de Ventas', 40, 30);
    doc.fontSize(10).text(`Generado: ${fecha}`, 40, 60);
    doc.fillColor('#0f172a');

    const resumen = await this.getResumen();

    const [topProductos] = await this.db.query<any>(`
      SELECT p.nombre,
             SUM(vp.cantidad) AS total_vendido,
             SUM(vp.cantidad * vp.precio) AS total_facturado
      FROM venta_productos vp
      JOIN productos p ON p.id_productos = vp.id_productos
      GROUP BY p.nombre
      ORDER BY total_vendido DESC
      LIMIT 6
    `);

    const [resumenMes] = await this.db.query<any>(`
      SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes,
             COUNT(*) AS cantidad_ventas,
             CAST(SUM(total) AS DECIMAL(10,2)) AS total_mes
      FROM venta
      GROUP BY mes
      ORDER BY mes DESC
      LIMIT 6
    `);

    const summaryY = 110;
    const boxWidth = 160;
    const boxHeight = 60;
    const gap = 14;
    const boxes = [
      { title: 'Ventas', value: resumen.total_ventas || 0 },
      { title: 'Total vendido', value: formatCurrency(resumen.dinero_total) },
      { title: 'Ticket promedio', value: formatCurrency(resumen.promedio) },
    ];

    boxes.forEach((box, index) => {
      const x = 40 + index * (boxWidth + gap);
      doc.roundedRect(x, summaryY, boxWidth, boxHeight, 10).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#64748b').fontSize(10).text(box.title, x + 12, summaryY + 12);
      doc.fillColor('#0f172a').fontSize(14).text(String(box.value), x + 12, summaryY + 30);
    });

    let currentY = summaryY + boxHeight + 30;
    doc.fillColor('#0f172a').fontSize(14).text('Top productos', 40, currentY);
    currentY += 16;
    doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).stroke('#e2e8f0');
    currentY += 10;

    const colX = [40, 320, 430];
    doc.fontSize(10).fillColor('#64748b');
    doc.text('Producto', colX[0], currentY);
    doc.text('Unidades', colX[1], currentY, { width: 80, align: 'right' });
    doc.text('Facturado', colX[2], currentY, { width: 120, align: 'right' });
    currentY += 14;
    doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).stroke('#e2e8f0');
    currentY += 8;

    doc.fontSize(10).fillColor('#0f172a');
    if (topProductos.length === 0) {
      doc.text('No hay datos de productos.', 40, currentY);
      currentY += 18;
    } else {
      topProductos.forEach((item: any) => {
        doc.text(item.nombre, colX[0], currentY, { width: 250 });
        doc.text(String(item.total_vendido), colX[1], currentY, { width: 80, align: 'right' });
        doc.text(formatCurrency(item.total_facturado), colX[2], currentY, { width: 120, align: 'right' });
        currentY += 16;
      });
    }

    currentY += 12;
    doc.fillColor('#0f172a').fontSize(14).text('Resumen mensual', 40, currentY);
    currentY += 16;
    doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).stroke('#e2e8f0');
    currentY += 10;

    doc.fontSize(10).fillColor('#64748b');
    doc.text('Mes', 40, currentY);
    doc.text('Ventas', 200, currentY, { width: 80, align: 'right' });
    doc.text('Total', 320, currentY, { width: 120, align: 'right' });
    currentY += 14;
    doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).stroke('#e2e8f0');
    currentY += 8;

    doc.fontSize(10).fillColor('#0f172a');
    if (resumenMes.length === 0) {
      doc.text('No hay datos mensuales.', 40, currentY);
    } else {
      resumenMes.forEach((row: any) => {
        doc.text(row.mes, 40, currentY);
        doc.text(String(row.cantidad_ventas), 200, currentY, { width: 80, align: 'right' });
        doc.text(formatCurrency(row.total_mes), 320, currentY, { width: 120, align: 'right' });
        currentY += 16;
      });
    }

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
