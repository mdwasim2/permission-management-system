import { RoleKey } from '@prisma/client';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(RoleKey)
  roleKey: RoleKey;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
