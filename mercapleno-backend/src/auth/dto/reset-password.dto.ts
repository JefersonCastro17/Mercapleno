import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_LOWERCASE_REGEX,
  PASSWORD_MESSAGES,
  PASSWORD_MIN_LENGTH,
  PASSWORD_NUMBER_REGEX,
  PASSWORD_SPECIAL_CHAR_REGEX,
  PASSWORD_UPPERCASE_REGEX,
} from '../../common/constants/validation.patterns';

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @ApiProperty({ minLength: 6, maxLength: 6 })
  @IsNotEmpty({ message: 'El código es requerido' })
  @IsString({ message: 'El código debe ser un texto' })
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  code: string;

  @ApiProperty({
    minLength: PASSWORD_MIN_LENGTH,
    description: 'Nueva contraseña segura: mínimo 12 caracteres, con mayúsculas, minúsculas, números y caracteres especiales',
    example: 'NewSecurePass123!',
  })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @IsString({ message: 'La nueva contraseña debe ser un texto' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MESSAGES.MIN_LENGTH })
  @Matches(PASSWORD_LOWERCASE_REGEX, { message: PASSWORD_MESSAGES.LOWERCASE })
  @Matches(PASSWORD_UPPERCASE_REGEX, { message: PASSWORD_MESSAGES.UPPERCASE })
  @Matches(PASSWORD_NUMBER_REGEX, { message: PASSWORD_MESSAGES.NUMBER })
  @Matches(PASSWORD_SPECIAL_CHAR_REGEX, { message: PASSWORD_MESSAGES.SPECIAL_CHAR })
  newPassword: string;

  @ApiProperty({
    minLength: PASSWORD_MIN_LENGTH,
    description: 'Confirmación de la nueva contraseña',
    example: 'NewSecurePass123!',
  })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  @IsString({ message: 'La confirmación de contraseña debe ser un texto' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MESSAGES.MIN_LENGTH })
  @Matches(PASSWORD_LOWERCASE_REGEX, { message: PASSWORD_MESSAGES.LOWERCASE })
  @Matches(PASSWORD_UPPERCASE_REGEX, { message: PASSWORD_MESSAGES.UPPERCASE })
  @Matches(PASSWORD_NUMBER_REGEX, { message: PASSWORD_MESSAGES.NUMBER })
  @Matches(PASSWORD_SPECIAL_CHAR_REGEX, { message: PASSWORD_MESSAGES.SPECIAL_CHAR })
  confirmPassword: string;
}

