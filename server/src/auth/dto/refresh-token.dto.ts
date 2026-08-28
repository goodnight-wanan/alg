import { IsJWT } from 'class-validator';

export class RefreshTokenDto {
  @IsJWT({ message: 'Refresh Token 格式无效' })
  refreshToken: string;
}
