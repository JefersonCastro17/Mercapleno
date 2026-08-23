import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetReferenceDocumentsDto {
  @ApiPropertyOptional({ enum: ['ENTRADA', 'SALIDA'] })
  @IsOptional()
  @IsString()
  @IsIn(['ENTRADA', 'SALIDA'])
  tipo_movimiento?: 'ENTRADA' | 'SALIDA';
}
