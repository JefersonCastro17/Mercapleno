import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProveedorDto {
  @ApiProperty({ example: 'Distribuciones Andina S.A.S.', description: 'Nombre del proveedor' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  @Matches(/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñüÜ\s.,\-&]+$/, {
    message: 'El nombre contiene caracteres no permitidos',
  })
  nombre: string;

  @ApiProperty({ example: 'Central', description: 'Apellido o razón social secundaria del proveedor' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser un texto' })
  @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
  @Matches(/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñüÜ\s.,\-&]+$/, {
    message: 'El apellido contiene caracteres no permitidos',
  })
  apellido: string;

  @ApiProperty({
    example: '3001234567',
    description: 'Teléfono del proveedor (exactamente 10 dígitos)',
    required: true,
  })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @IsString({ message: 'El teléfono debe ser un texto' })
  @Matches(/^[0-9]{10}$/, {
    message: 'El teléfono debe contener exactamente 10 dígitos numéricos',
  })
  telefono: string;
}