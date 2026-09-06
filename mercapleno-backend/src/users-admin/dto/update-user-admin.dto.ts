import { PartialType } from '@nestjs/swagger';
import { CreateUserAdminDto } from './create-user-admin.dto';

export class UpdateUserAdminDto extends PartialType(CreateUserAdminDto) {}
