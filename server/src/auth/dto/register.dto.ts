import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 32, { message: '用户名长度必须为 3 到 32 个字符' })
  @Matches(/^[\p{L}\p{N}_-]+$/u, {
    message: '用户名只能包含文字、数字、下划线和连字符',
  })
  username: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @MaxLength(254, { message: '邮箱地址不能超过 254 个字符' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度不能少于 8 位' })
  @MaxLength(72, { message: '密码长度不能超过 72 位' })
  password: string;
}
