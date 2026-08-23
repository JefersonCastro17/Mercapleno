import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/decorators/roles.decorator';


@Roles(1, 2)
@ApiTags('Reportes')
@ApiBearerAuth()
@ApiSecurity('x-api-key')
@Controller('sales/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('ventas-mes')
  @ApiOperation({ summary: 'Ventas agrupadas por mes' })
  @ApiQuery({ name: 'inicio', required: false, description: 'Formato YYYY-MM' })
  @ApiQuery({ name: 'fin', required: false, description: 'Formato YYYY-MM' })
  getVentasMes(@Query('inicio') inicio?: string, @Query('fin') fin?: string) {
    return this.reportsService.getVentasMes(inicio, fin);
  }

  @Get('top-productos')
  @ApiOperation({ summary: 'Top 10 productos mas vendidos' })
  getTopProductos() {
    return this.reportsService.getTopProductos();
  }

  @Get('resumen')
  @ApiOperation({ summary: 'KPIs generales de ventas' })
  getResumen() {
    return this.reportsService.getResumen();
  }

  @Get('resumen-mes')
  @ApiOperation({ summary: 'Resumen mensual de ventas' })
  getResumenMes() {
    return this.reportsService.getResumenMes();
  }

  @Get('pdf-resumen')
  @ApiOperation({ summary: 'Descargar reporte PDF de ventas' })
  async getPdfResumen(@Res() res: Response) {
    const buffer = await this.reportsService.buildResumenPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas.pdf');
    res.send(buffer);
  }
}
