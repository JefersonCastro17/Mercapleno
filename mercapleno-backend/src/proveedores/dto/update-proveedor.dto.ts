import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProveedorDto {
  @ApiProperty({ example: 'Distribuciones Andina S.A.S.', required: false })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  @Matches(/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñüÜ\s.,\-&]+$/, {
    message: 'El nombre contiene caracteres no permitidos',
  })
  nombre?: string;

  @ApiProperty({ example: 'Central', required: false })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser un texto' })
  @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
  @Matches(/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñüÜ\s.,\-&]+$/, {
    message: 'El apellido contiene caracteres no permitidos',
  })
  apellido?: string;

  @ApiProperty({ example: '3001234567', required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @Matches(/^[0-9]{10}$/, {
    message: 'El teléfono debe contener exactamente 10 dígitos numéricos',
  })
  telefono?: string;
}