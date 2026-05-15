import { RoleKey, UserStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(RoleKey)
  roleKey?: RoleKey;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
