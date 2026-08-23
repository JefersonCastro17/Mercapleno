import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  code: string;
}
