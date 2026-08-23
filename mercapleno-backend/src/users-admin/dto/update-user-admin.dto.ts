import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { CreateUserAdminDto } from './create-user-admin.dto';

export class UpdateUserAdminDto extends PartialType(CreateUserAdminDto) {
  @ApiPropertyOptional({ minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener el formato YYYY-MM-DD' })
  fecha_nacimiento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id_rol?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id_tipo_identificacion?: number;
}
