import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Nombre del producto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @IsString({ message: 'El nombre del producto debe ser un texto' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-_/()[\]%&+':]+$/, {
    message: 'El nombre del producto contiene caracteres no permitidos',
  })
  nombre: string;

  @ApiProperty({ description: 'Precio del producto (mínimo 0)', minimum: 0 })
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  @Min(0, { message: 'El precio no puede ser menor a 0' })
  precio: number;

  @ApiProperty({ description: 'ID de la categoría' })
  @Type(() => Number)
  @IsInt({ message: 'La categoría debe ser un número entero' })
  id_categoria: number;

  @ApiProperty({ description: 'ID del proveedor' })
  @Type(() => Number)
  @IsInt({ message: 'El proveedor debe ser un número entero' })
  id_proveedor: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(255, { message: 'La descripción no puede superar los 255 caracteres' })
  descripcion?: string;

  @ApiProperty({ default: 'Disponible', enum: ['Disponible', 'Agotado', 'Deshabilitado'] })
  @IsString()
  @IsIn(['Disponible', 'Agotado', 'Deshabilitado'], {
    message: 'El estado debe ser Disponible, Agotado o Deshabilitado',
  })
  estado: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser un texto' })
  @MaxLength(255, { message: 'La URL de la imagen no puede superar los 255 caracteres' })
  imagen?: string;
}
