import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CategoryType, SongSourceType, SongStatus } from '@prisma/client';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function optionalTrim(value: unknown) {
  const trimmed = trim(value);
  return trimmed === '' ? undefined : trimmed;
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  return trimmed.split(',').map((item) => item.trim());
}

export class PaginationQueryDto {
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
  pageSize = 20;

  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '搜索关键词必须是字符串' })
  @MaxLength(100, { message: '搜索关键词不能超过 100 个字符' })
  @IsOptional()
  search?: string;
}

export class AdminSongQueryDto extends PaginationQueryDto {
  @IsEnum(SongStatus, { message: '歌曲状态无效' })
  @IsOptional()
  status?: SongStatus;
}

export class CreateArtistDto {
  @Transform(({ value }) => optionalTrim(value))
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '公开 ID 只能包含字母、数字、下划线和连字符',
  })
  @Length(3, 64, { message: '公开 ID 长度必须为 3 到 64 个字符' })
  @IsOptional()
  publicId?: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: '歌手名称必须是字符串' })
  @Length(1, 100, { message: '歌手名称长度必须为 1 到 100 个字符' })
  name: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '歌手地区必须是字符串' })
  @MaxLength(60, { message: '歌手地区不能超过 60 个字符' })
  @IsOptional()
  region?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '歌手简介必须是字符串' })
  @MaxLength(5000, { message: '歌手简介不能超过 5000 个字符' })
  @IsOptional()
  biography?: string;
}

export class UpdateArtistDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '歌手名称必须是字符串' })
  @Length(1, 100, { message: '歌手名称长度必须为 1 到 100 个字符' })
  @IsOptional()
  name?: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: '歌手地区必须是字符串' })
  @MaxLength(60, { message: '歌手地区不能超过 60 个字符' })
  @IsOptional()
  region?: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: '歌手简介必须是字符串' })
  @MaxLength(5000, { message: '歌手简介不能超过 5000 个字符' })
  @IsOptional()
  biography?: string;
}

export class CreateAlbumDto {
  @Transform(({ value }) => optionalTrim(value))
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '公开 ID 只能包含字母、数字、下划线和连字符',
  })
  @Length(3, 64, { message: '公开 ID 长度必须为 3 到 64 个字符' })
  @IsOptional()
  publicId?: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: '专辑名称必须是字符串' })
  @Length(1, 160, { message: '专辑名称长度必须为 1 到 160 个字符' })
  title: string;

  @IsUUID('4', { message: '歌手 ID 无效' })
  artistId: string;

  @IsDateString({}, { message: '发行日期格式无效' })
  @IsOptional()
  releaseDate?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '专辑简介必须是字符串' })
  @MaxLength(5000, { message: '专辑简介不能超过 5000 个字符' })
  @IsOptional()
  description?: string;
}

export class CreateCategoryDto {
  @Transform(({ value }) => trim(value))
  @IsString({ message: '分类名称必须是字符串' })
  @Length(1, 60, { message: '分类名称长度必须为 1 到 60 个字符' })
  name: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @Matches(/^[a-z0-9-]+$/, {
    message: '分类别名只能包含小写字母、数字和连字符',
  })
  @Length(1, 60, { message: '分类别名长度必须为 1 到 60 个字符' })
  slug: string;

  @IsEnum(CategoryType, { message: '分类类型无效' })
  type: CategoryType;

  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '分类描述必须是字符串' })
  @MaxLength(255, { message: '分类描述不能超过 255 个字符' })
  @IsOptional()
  description?: string;
}

export class UpdateCategoryDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '分类名称必须是字符串' })
  @Length(1, 60, { message: '分类名称长度必须为 1 到 60 个字符' })
  @IsOptional()
  name?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @Matches(/^[a-z0-9-]+$/, {
    message: '分类别名只能包含小写字母、数字和连字符',
  })
  @Length(1, 60, { message: '分类别名长度必须为 1 到 60 个字符' })
  @IsOptional()
  slug?: string;

  @IsEnum(CategoryType, { message: '分类类型无效' })
  @IsOptional()
  type?: CategoryType;

  @Transform(({ value }) => trim(value))
  @IsString({ message: '分类描述必须是字符串' })
  @MaxLength(255, { message: '分类描述不能超过 255 个字符' })
  @IsOptional()
  description?: string;
}

class SongMetadataDto {
  @Transform(({ value }) => optionalTrim(value))
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '公开 ID 只能包含字母、数字、下划线和连字符',
  })
  @Length(3, 64, { message: '公开 ID 长度必须为 3 到 64 个字符' })
  @IsOptional()
  publicId?: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: '歌曲名称必须是字符串' })
  @Length(1, 160, { message: '歌曲名称长度必须为 1 到 160 个字符' })
  title: string;

  @IsUUID('4', { message: '歌手 ID 无效' })
  artistId: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsUUID('4', { message: '专辑 ID 无效' })
  @IsOptional()
  albumId?: string;

  @Transform(({ value }) => stringArray(value))
  @IsArray({ message: '分类 ID 必须是数组' })
  @ArrayMaxSize(20, { message: '每首歌曲最多关联 20 个分类' })
  @ArrayUnique({ message: '分类 ID 不能重复' })
  @IsUUID('4', { each: true, message: '分类 ID 无效' })
  @IsOptional()
  categoryIds?: string[];

  @IsEnum(SongStatus, { message: '歌曲状态无效' })
  @IsOptional()
  status?: SongStatus;
}

export class CreateRemoteSongDto extends SongMetadataDto {
  @IsEnum(SongSourceType, { message: '歌曲来源类型无效' })
  sourceType: SongSourceType;

  @Transform(({ value }) => trim(value))
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: '远程音频地址无效' },
  )
  @MaxLength(2048, { message: '远程音频地址不能超过 2048 个字符' })
  remoteUrl: string;

  @Type(() => Number)
  @IsInt({ message: '歌曲时长必须是整数秒' })
  @Min(1, { message: '歌曲时长必须大于 0' })
  @Max(86400, { message: '歌曲时长不能超过 24 小时' })
  @IsOptional()
  durationSeconds?: number;

  @Type(() => Number)
  @IsInt({ message: '码率必须是整数' })
  @Min(1, { message: '码率必须大于 0' })
  @Max(10000, { message: '码率不能超过 10000 kbps' })
  @IsOptional()
  bitrateKbps?: number;
}

export class UploadSongDto extends SongMetadataDto {}

export class UpdateSongDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsString({ message: '歌曲名称必须是字符串' })
  @Length(1, 160, { message: '歌曲名称长度必须为 1 到 160 个字符' })
  @IsOptional()
  title?: string;

  @IsUUID('4', { message: '歌手 ID 无效' })
  @IsOptional()
  artistId?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsUUID('4', { message: '专辑 ID 无效' })
  @IsOptional()
  albumId?: string;

  @Transform(({ value }) => stringArray(value))
  @IsArray({ message: '分类 ID 必须是数组' })
  @ArrayMaxSize(20, { message: '每首歌曲最多关联 20 个分类' })
  @ArrayUnique({ message: '分类 ID 不能重复' })
  @IsUUID('4', { each: true, message: '分类 ID 无效' })
  @IsOptional()
  categoryIds?: string[];

  @Transform(({ value }) => optionalTrim(value))
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: '远程音频地址无效' },
  )
  @MaxLength(2048, { message: '远程音频地址不能超过 2048 个字符' })
  @IsOptional()
  remoteUrl?: string;
}

export class UpdateSongStatusDto {
  @IsEnum(SongStatus, { message: '歌曲状态无效' })
  status: SongStatus;
}

export class BatchSongIdsDto {
  @IsArray({ message: '歌曲 ID 必须是数组' })
  @ArrayNotEmpty({ message: '请至少选择一首歌曲' })
  @ArrayMaxSize(100, { message: '每次最多处理 100 首歌曲' })
  @ArrayUnique({ message: '歌曲 ID 不能重复' })
  @IsUUID('4', { each: true, message: '歌曲 ID 无效' })
  ids: string[];
}

export class BatchSongStatusDto extends BatchSongIdsDto {
  @IsEnum(SongStatus, { message: '歌曲状态无效' })
  status: SongStatus;
}
