import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
