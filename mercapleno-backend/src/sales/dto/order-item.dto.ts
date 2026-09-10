import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ description: 'ID del producto' })
  @Transform(({ value }) => (value != null ? String(value) : value))
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  @IsString({ message: 'El ID del producto debe ser un texto o número' })
  id: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;
}
