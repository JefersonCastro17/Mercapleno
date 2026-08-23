import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CartService } from './cart.service';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener carrito del usuario autenticado' })
  getCart(@CurrentUser() user?: AuthUser) {
    return this.cartService.getCart(Number(user?.id));
  }

  @Get('sum')
  @ApiOperation({ summary: 'Obtener sumas y validaciones del carrito' })
  getSum(@CurrentUser() user?: AuthUser) {
    return this.cartService.getCartSum(Number(user?.id));
  }

  @Post('items')
  @ApiOperation({ summary: 'Agregar item al carrito' })
  addItem(@CurrentUser() user?: AuthUser, @Body() body?: any) {
    return this.cartService.addItem(Number(user?.id), body);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Actualizar cantidad de un item del carrito' })
  updateItem(@CurrentUser() user?: AuthUser, @Param('id', ParseIntPipe) id?: number, @Body() body?: any) {
    return this.cartService.updateItem(Number(user?.id), Number(id), body);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Eliminar item del carrito' })
  deleteItem(@CurrentUser() user?: AuthUser, @Param('id', ParseIntPipe) id?: number) {
    return this.cartService.deleteItem(Number(user?.id), Number(id));
  }

  @Delete()
  @ApiOperation({ summary: 'Vaciar carrito del usuario' })
  clearCart(@CurrentUser() user?: AuthUser) {
    return this.cartService.clearCart(Number(user?.id));
  }
}
