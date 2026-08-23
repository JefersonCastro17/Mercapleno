import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productImageUploadOptions, resolveUploadedProductImagePath } from './product-image-upload.util';
import { ProductsService } from './products.service';
import { FileInterceptor } from '@nestjs/platform-express';

const productMultipartSchema = {
  type: 'object',
  properties: {
    nombre: { type: 'string' },
    precio: { type: 'number' },
    id_categoria: { type: 'integer' },
    id_proveedor: { type: 'integer' },
    descripcion: { type: 'string', nullable: true },
    estado: { type: 'string', enum: ['Disponible', 'Agotado'] },
    imagen: { type: 'string', format: 'binary' },
  },
  required: ['nombre', 'precio', 'id_categoria', 'id_proveedor', 'estado'],
};

@Roles(1)
@ApiTags('Productos')
@ApiBearerAuth()
@Controller('productos')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('catalogos')
  @ApiOperation({ summary: 'Listar categorias y proveedores disponibles para productos' })
  getCatalogs() {
    return this.productsService.getCatalogs();
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  findAll() {
    return this.productsService.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('imagen', productImageUploadOptions))
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ schema: productMultipartSchema })
  @ApiOperation({ summary: 'Crear producto' })
  create(@Body() dto: CreateProductDto, @UploadedFile() imageFile?: { filename?: string }) {
    return this.productsService.create(dto, resolveUploadedProductImagePath(imageFile));
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('imagen', productImageUploadOptions))
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ schema: productMultipartSchema })
  @ApiOperation({ summary: 'Actualizar producto' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFile() imageFile?: { filename?: string },
  ) {
    return this.productsService.update(id, dto, resolveUploadedProductImagePath(imageFile));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
