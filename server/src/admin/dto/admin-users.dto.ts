import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class AdminUserQueryDto {
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码不能小于 1' })
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量不能小于 1' })
  @Max(100, { message: '每页数量不能超过 100' })
  @IsOptional()
  pageSize = 20;

  @IsString({ message: '搜索关键词必须是字符串' })
  @MaxLength(100, { message: '搜索关键词不能超过 100 个字符' })
  @IsOptional()
  search?: string;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus, { message: '用户状态无效' })
  status: UserStatus;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: '用户角色无效' })
  role: UserRole;
}
