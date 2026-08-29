import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function optionalTrim(value: unknown) {
  const trimmed = trim(value);
  return trimmed === '' ? undefined : trimmed;
}

export class MePaginationQueryDto {
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码不能小于 1' })
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量不能小于 1' })
  @Max(50, { message: '每页数量不能超过 50' })
  @IsOptional()
  pageSize = 50;
}

export class CreateUserPlaylistDto {
  @Transform(({ value }) => trim(value))
  @IsString({ message: '歌单名称必须是字符串' })
  @Length(1, 30, { message: '歌单名称长度必须为 1 到 30 个字符' })
  title: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '歌单简介必须是字符串' })
  @MaxLength(500, { message: '歌单简介不能超过 500 个字符' })
  @IsOptional()
  description?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '歌曲 ID 必须是字符串' })
  @MaxLength(64, { message: '歌曲 ID 不能超过 64 个字符' })
  @IsOptional()
  songId?: string;
}

export class UpdateUserPlaylistDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '歌单名称必须是字符串' })
  @Length(1, 30, { message: '歌单名称长度必须为 1 到 30 个字符' })
  @IsOptional()
  title?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '歌单简介必须是字符串' })
  @MaxLength(500, { message: '歌单简介不能超过 500 个字符' })
  @IsOptional()
  description?: string;
}

export class UpdateProfileDto {
  @Transform(({ value }) => trim(value))
  @IsString({ message: '昵称必须是字符串' })
  @Length(1, 50, { message: '昵称长度必须为 1 到 50 个字符' })
  nickname: string;
}

export class ChangePasswordDto {
  @IsString({ message: '当前密码必须是字符串' })
  @MinLength(1, { message: '请输入当前密码' })
  @MaxLength(72, { message: '当前密码不能超过 72 位' })
  currentPassword: string;

  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码长度不能少于 8 位' })
  @MaxLength(72, { message: '新密码长度不能超过 72 位' })
  newPassword: string;
}
