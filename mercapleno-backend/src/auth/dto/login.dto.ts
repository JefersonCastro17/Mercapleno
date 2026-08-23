import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@mercapleno.com',
    description: 'Email del usuario',
  })
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Contraseña del usuario',
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  password: string;
}