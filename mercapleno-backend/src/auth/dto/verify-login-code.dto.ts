import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyLoginCodeDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token pendiente obtenido del endpoint de login (para usuarios admin/gerentes)',
  })
  @IsString()
  @IsNotEmpty()
  pendingToken: string;

  @ApiProperty({
    example: '123456',
    description: 'Código de 6 dígitos enviado al email del usuario',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
