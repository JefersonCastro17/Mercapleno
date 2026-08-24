import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { BaseUserDto } from '../../common/dto/base-user.dto';

export class CreateUserAdminDto extends BaseUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsInt({ message: 'El id del rol debe ser un número entero' })
  id_rol: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean({ message: 'email_verified debe ser un valor booleano' })
  email_verified?: boolean;
}