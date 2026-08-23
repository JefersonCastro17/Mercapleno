import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { GetReferenceDocumentsDto } from './dto/get-reference-documents.dto';
import { RegisterMovementDto } from './dto/register-movement.dto';
import { InventoryService } from './inventory.service';

@Roles(1, 2)
@ApiTags('Movimientos')
@ApiBearerAuth()
@Controller('movimientos')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('productos')
  @ApiOperation({ summary: 'Obtener productos con stock actual' })
  getProductsWithStock() {
    return this.inventoryService.getProductsWithStock();
  }

  @Get('documentos')
  @ApiOperation({ summary: 'Obtener documentos de referencia disponibles para movimientos' })
  getReferenceDocuments(@Query() query: GetReferenceDocumentsDto) {
    return this.inventoryService.getReferenceDocuments(query.tipo_movimiento);
  }

  @Post('registrar')
  @ApiOperation({ summary: 'Registrar movimiento de inventario' })
  registerMovement(@Body() dto: RegisterMovementDto, @CurrentUser() user?: AuthUser) {
    return this.inventoryService.registerMovement(dto, user?.id);
  }
}
