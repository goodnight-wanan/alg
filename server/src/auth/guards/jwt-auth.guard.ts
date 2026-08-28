import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { Request } from 'express';
import { UsersService } from '../../users/users.service.js';
import { AuthenticatedRequest, AuthTokenPayload } from '../auth.types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw this.invalidAccessToken();
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        token,
        {
          secret: this.getAccessSecret(),
        },
      );

      if (payload.type !== 'access' || !payload.sub) {
        throw this.invalidAccessToken();
      }

      const user = await this.usersService.findPublicById(payload.sub);
      if (!user) {
        throw this.invalidAccessToken();
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException({
          code: 'ACCOUNT_DISABLED',
          message: '账号已被禁用',
        });
      }

      (request as AuthenticatedRequest).user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw this.invalidAccessToken();
    }
  }

  private extractBearerToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private getAccessSecret() {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters');
    }
    return secret;
  }

  private invalidAccessToken() {
    return new UnauthorizedException({
      code: 'INVALID_ACCESS_TOKEN',
      message: '登录状态无效或已过期',
    });
  }
}
