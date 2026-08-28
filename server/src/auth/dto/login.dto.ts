import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: '账号必须是字符串' })
  @MinLength(1, { message: '请输入用户名或邮箱' })
  @MaxLength(254, { message: '账号不能超过 254 个字符' })
  account: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(1, { message: '请输入密码' })
  @MaxLength(72, { message: '密码长度不能超过 72 位' })
  password: string;
}
