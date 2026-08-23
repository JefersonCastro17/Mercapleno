import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre del producto no puede contener números ni caracteres especiales',
  })
  nombre: string;

  @ApiProperty({ description: 'Precio del producto (mínimo 0)', minimum: 0 })
  @IsNumber()
  @Min(0)
  precio: number;

  @ApiProperty({ description: 'ID de la categoría' })
  @IsInt()
  id_categoria: number;

  @ApiProperty({ description: 'ID del proveedor' })
  @IsInt()
  id_proveedor: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ default: 'Disponible', enum: ['Disponible', 'Agotado'] })
  @IsString()
  @IsIn(['Disponible', 'Agotado'])
  estado: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imagen?: string;
}
