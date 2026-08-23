import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  id: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  cantidad: number;
}
