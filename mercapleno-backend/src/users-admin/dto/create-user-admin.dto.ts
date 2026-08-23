import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';

export class CreateUserAdminDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, {
    message: 'El nombre solo puede contener letras',
  })
  nombre: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser un texto' })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, {
    message: 'El apellido solo puede contener letras',
  })
  apellido: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString({ message: 'La dirección debe ser un texto' })
  direccion: string;

  @ApiProperty({ example: '2000-01-01' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString({}, {
    message: 'La fecha de nacimiento debe tener el formato YYYY-MM-DD',
  })
  fecha_nacimiento: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsInt({ message: 'El id del rol debe ser un número entero' })
  id_rol: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El tipo de identificación es obligatorio' })
  @IsInt({
    message: 'El tipo de identificación debe ser un número entero',
  })
  id_tipo_identificacion: number;

  @ApiProperty({ description: 'Número de identificación (solo números)' })
  @IsNotEmpty({ message: 'El número de identificación es obligatorio' })
  @IsString({
    message: 'El número de identificación debe ser un texto',
  })
  @Matches(/^\d+$/, {
    message: 'El número de identificación debe contener solo dígitos',
  })
  numero_identificacion: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean({ message: 'email_verified debe ser un valor booleano' })
  email_verified?: boolean;
}