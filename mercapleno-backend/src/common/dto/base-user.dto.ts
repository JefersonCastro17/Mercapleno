import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsInt, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import {
  DOCUMENT_REGEX,
  DOCUMENT_VALIDATION_MESSAGE,
  NAME_REGEX,
  NAME_VALIDATION_MESSAGE,
  PASSWORD_LOWERCASE_REGEX,
  PASSWORD_MESSAGES,
  PASSWORD_MIN_LENGTH,
  PASSWORD_NUMBER_REGEX,
  PASSWORD_SPECIAL_CHAR_REGEX,
  PASSWORD_UPPERCASE_REGEX,
} from '../constants/validation.patterns';

export class BaseUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @Matches(NAME_REGEX, {
    message: `El nombre ${NAME_VALIDATION_MESSAGE.toLowerCase()}`,
  })
  nombre: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString({ message: 'El apellido debe ser un texto' })
  @Matches(NAME_REGEX, {
    message: `El apellido ${NAME_VALIDATION_MESSAGE.toLowerCase()}`,
  })
  apellido: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({
    minLength: PASSWORD_MIN_LENGTH,
    description: 'Contraseña segura: mínimo 12 caracteres, con mayúsculas, minúsculas, números y caracteres especiales',
    example: 'SecurePass123!',
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MESSAGES.MIN_LENGTH })
  @Matches(PASSWORD_LOWERCASE_REGEX, { message: PASSWORD_MESSAGES.LOWERCASE })
  @Matches(PASSWORD_UPPERCASE_REGEX, { message: PASSWORD_MESSAGES.UPPERCASE })
  @Matches(PASSWORD_NUMBER_REGEX, { message: PASSWORD_MESSAGES.NUMBER })
  @Matches(PASSWORD_SPECIAL_CHAR_REGEX, { message: PASSWORD_MESSAGES.SPECIAL_CHAR })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString({ message: 'La dirección debe ser un texto' })
  direccion: string;

  @ApiProperty({ example: '2000-01-01' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener el formato YYYY-MM-DD' })
  fecha_nacimiento: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El tipo de identificación es obligatorio' })
  @IsInt({ message: 'El tipo de identificación debe ser un número entero' })
  id_tipo_identificacion: number;

  @ApiProperty({ description: 'Número de identificación (solo números)' })
  @IsNotEmpty({ message: 'El número de identificación es obligatorio' })
  @IsString({ message: 'El número de identificación debe ser un texto' })
  @Matches(DOCUMENT_REGEX, { message: DOCUMENT_VALIDATION_MESSAGE })
  numero_identificacion: string;
}
