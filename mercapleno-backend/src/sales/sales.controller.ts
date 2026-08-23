import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('products')
  @Public()
  @ApiOperation({ summary: 'Obtener catalogo de productos filtrado' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'precioMin', required: false })
  @ApiQuery({ name: 'precioMax', required: false })
  getProducts(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('precioMin') precioMin?: string,
    @Query('precioMax') precioMax?: string,
  ) {
    return this.salesService.getFilteredProducts({
      search,
      category,
      precioMin,
      precioMax,
    });
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Obtener categorias disponibles para venta' })
  getCategories() {
    return this.salesService.getAvailableCategories();
  }

  @Get('payment-methods')
  @Public()
  @ApiOperation({ summary: 'Obtener metodos de pago disponibles' })
  getPaymentMethods() {
    return this.salesService.getPaymentMethods();
  }

  @Post('orders')
  @ApiOperation({ summary: 'Registrar orden de compra y descontar inventario' })
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user?: AuthUser) {
    return this.salesService.createOrder(dto, user?.id);
  }
}
