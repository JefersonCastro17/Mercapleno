import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    minLength: 12,
    description: 'Nueva contraseña segura: mínimo 12 caracteres, con mayúsculas, minúsculas, números y caracteres especiales',
    example: 'NewSecurePass123!'
  })
  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
  @Matches(/^(?=.*[a-z])/, { message: 'La contraseña debe contener al menos una letra minúscula' })
  @Matches(/^(?=.*[A-Z])/, { message: 'La contraseña debe contener al menos una letra mayúscula' })
  @Matches(/^(?=.*\d)/, { message: 'La contraseña debe contener al menos un número' })
  @Matches(/^(?=.*[@$!%*?&])/, { message: 'La contraseña debe contener al menos un carácter especial (@$!%*?&)' })
  newPassword: string;

  @ApiProperty({
    minLength: 12,
    description: 'Confirmación de la nueva contraseña',
    example: 'NewSecurePass123!'
  })
  @IsString()
  @MinLength(12, { message: 'La confirmación debe tener al menos 12 caracteres' })
  @Matches(/^(?=.*[a-z])/, { message: 'La confirmación debe contener al menos una letra minúscula' })
  @Matches(/^(?=.*[A-Z])/, { message: 'La confirmación debe contener al menos una letra mayúscula' })
  @Matches(/^(?=.*\d)/, { message: 'La confirmación debe contener al menos un número' })
  @Matches(/^(?=.*[@$!%*?&])/, { message: 'La confirmación debe contener al menos un carácter especial (@$!%*?&)' })
  confirmPassword: string;
}
