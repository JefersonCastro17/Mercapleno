import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf } from 'class-validator';

export class RegisterMovementDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  id_producto: number;

  @ApiProperty({ enum: ['ENTRADA', 'SALIDA'] })
  @IsString()
  @IsIn(['ENTRADA', 'SALIDA'])
  tipo_movimiento: 'ENTRADA' | 'SALIDA';

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional({ description: 'ID de documento (ej: CC, RUC, 01, 02). Si no se envía, el backend usará ND.' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @ValidateIf((o) => o.id_documento !== undefined && o.id_documento !== null && o.id_documento !== '')
  @IsOptional()
  @IsString()
  @MaxLength(5)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'El ID de documento solo puede contener letras y números' })
  id_documento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  comentario?: string;
}
