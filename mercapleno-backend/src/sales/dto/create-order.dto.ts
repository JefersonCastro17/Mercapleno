import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty()
  @IsNumber()
  total: number;

  @ApiPropertyOptional({ description: 'Metodo de pago, por ejemplo M1, M2' })
  @IsOptional()
  @IsString()
  id_metodo?: string;

  @ApiPropertyOptional({ description: 'Alias legacy de id_metodo' })
  @IsOptional()
  @IsString()
  metodo_pago?: string;
}
