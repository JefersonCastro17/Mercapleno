import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsInt, IsOptional, IsString, Matches, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsNotEmpty({message: 'El nombre es obligatorio'})
  @IsString()
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, {  /*Es como amazon todos los productos de la a "a" la "z"*/
    message: 'El nombre solo puede contener letra',
  })
  nombre: string;

  @ApiProperty()
  @IsNotEmpty({message: 'El apellido es obligatorio'})
  @IsString()
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, { 
    message: 'El apellido solo puede contener letra',
  })
  apellido: string;

  @ApiProperty()
  @IsNotEmpty({message: 'El email es obligatorio'})
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 12,
    description: 'Contraseña segura: mínimo 12 caracteres, con mayúsculas, minúsculas, números y caracteres especiales',
    example: 'SecurePass123!'
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
  @Matches(/^(?=.*[a-z])/, { message: 'La contraseña debe contener al menos una letra minúscula' })
  @Matches(/^(?=.*[A-Z])/, { message: 'La contraseña debe contener al menos una letra mayúscula' })
  @Matches(/^(?=.*\d)/, { message: 'La contraseña debe contener al menos un número' })
  @Matches(/^(?=.*[@$!%*?&])/, { message: 'La contraseña debe contener al menos un carácter especial (@$!%*?&)' })
  password: string;

  @ApiProperty()
  @IsString()
  direccion: string;

  @ApiProperty({ example: '2000-01-01' })
  @IsDateString()
  fecha_nacimiento: string;

  @ApiProperty()
  @IsInt()
  id_tipo_identificacion: number;

  @ApiProperty({ description: 'Número de identificación (solo números)' })
  @IsString()
  @Matches(/^\d+$/, { message: 'El número de identificación debe contener solo dígitos' })
  numero_identificacion: string;
}
