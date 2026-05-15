import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';

class PermissionOverrideDto {
  @IsString()
  permissionKey: string;

  @IsBoolean()
  allowed: boolean;
}

export class SetUserPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideDto)
  permissions: PermissionOverrideDto[];
}
