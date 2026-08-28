import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service.js';
import { PublicUser } from '../users/user.types.js';
import { UsersService } from '../users/users.service.js';
import { AuthTokenPayload, RequestMetadata } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const PASSWORD_HASH_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, metadata: RequestMetadata) {
    const usernameNormalized = dto.username.toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ usernameNormalized }, { email: dto.email }],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw this.accountConflict();
    }

    const passwordHash = await hash(dto.password, PASSWORD_HASH_ROUNDS);

    try {
      const user = await this.usersService.create({
        username: dto.username,
        usernameNormalized,
        email: dto.email,
        passwordHash,
      });
      const tokens = await this.createTokenPair(user, metadata);

      return { user, ...tokens };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw this.accountConflict();
      }
      throw error;
    }
  }

  async login(dto: LoginDto, metadata: RequestMetadata) {
    const user = await this.usersService.findForAuthentication(dto.account);
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '用户名、邮箱或密码错误',
      });
    }

    this.assertActiveUser(user.status);

    const [tokens] = await Promise.all([
      this.createTokenPair(user, metadata),
      this.usersService.markLoggedIn(user.id),
    ]);

    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string, metadata: RequestMetadata) {
    const payload = await this.verifyRefreshToken(refreshToken);
    if (!payload.jti || !payload.sub) {
      throw this.invalidRefreshToken();
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      !this.matchesTokenHash(refreshToken, storedToken.tokenHash)
    ) {
      throw this.invalidRefreshToken();
    }

    this.assertActiveUser(storedToken.user.status);

    const nextTokens = await this.prepareTokenPair(storedToken.user);
    const revokedAt = new Date();

    await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          expiresAt: { gt: revokedAt },
        },
        data: { revokedAt },
      });

      if (result.count !== 1) {
        throw this.invalidRefreshToken();
      }

      await transaction.refreshToken.create({
        data: this.refreshTokenData(storedToken.userId, nextTokens, metadata),
      });
    });

    return {
      user: this.toPublicUser(storedToken.user),
      ...nextTokens.response,
    };
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    if (!payload.jti || !payload.sub) {
      throw this.invalidRefreshToken();
    }

    const result = await this.prisma.refreshToken.updateMany({
      where: {
        id: payload.jti,
        userId: payload.sub,
        tokenHash: this.hashToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (result.count !== 1) {
      throw this.invalidRefreshToken();
    }

    return { message: '已退出登录' };
  }

  private async createTokenPair(
    user: Pick<PublicUser, 'id' | 'role'>,
    metadata: RequestMetadata,
  ) {
    const tokens = await this.prepareTokenPair(user);
    await this.prisma.refreshToken.create({
      data: this.refreshTokenData(user.id, tokens, metadata),
    });
    return tokens.response;
  }

  private async prepareTokenPair(user: Pick<PublicUser, 'id' | 'role'>) {
    const accessTtl = this.getPositiveInteger('JWT_ACCESS_TTL_SECONDS', 900);
    const refreshTtl = this.getPositiveInteger(
      'JWT_REFRESH_TTL_SECONDS',
      604800,
    );
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'access',
        } satisfies AuthTokenPayload,
        {
          secret: this.getSecret('JWT_ACCESS_SECRET'),
          expiresIn: accessTtl,
        },
      ),
      this.jwtService.signAsync(
        { sub: user.id, type: 'refresh' } satisfies AuthTokenPayload,
        {
          secret: this.getSecret('JWT_REFRESH_SECRET'),
          expiresIn: refreshTtl,
          jwtid: refreshTokenId,
        },
      ),
    ]);

    return {
      refreshTokenId,
      refreshTokenHash: this.hashToken(refreshToken),
      refreshTokenExpiresAt: new Date(Date.now() + refreshTtl * 1000),
      response: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer' as const,
        expiresIn: accessTtl,
      },
    };
  }

  private refreshTokenData(
    userId: string,
    tokens: Awaited<ReturnType<AuthService['prepareTokenPair']>>,
    metadata: RequestMetadata,
  ): Prisma.RefreshTokenUncheckedCreateInput {
    return {
      id: tokens.refreshTokenId,
      userId,
      tokenHash: tokens.refreshTokenHash,
      expiresAt: tokens.refreshTokenExpiresAt,
      deviceInfo: metadata.deviceInfo?.slice(0, 255),
      ipAddress: metadata.ipAddress?.slice(0, 45),
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        token,
        {
          secret: this.getSecret('JWT_REFRESH_SECRET'),
        },
      );
      if (payload.type !== 'refresh') {
        throw this.invalidRefreshToken();
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw this.invalidRefreshToken();
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private matchesTokenHash(token: string, storedHash: string) {
    const tokenHash = Buffer.from(this.hashToken(token), 'utf8');
    const expectedHash = Buffer.from(storedHash, 'utf8');
    return (
      tokenHash.length === expectedHash.length &&
      timingSafeEqual(tokenHash, expectedHash)
    );
  }

  private assertActiveUser(status: UserStatus) {
    if (status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'ACCOUNT_DISABLED',
        message: '账号已被禁用',
      });
    }
  }

  private toPublicUser(user: {
    id: string;
    username: string;
    email: string;
    nickname: string | null;
    avatarUrl: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private getSecret(key: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET') {
    const secret = this.configService.get<string>(key);
    if (!secret || secret.length < 32) {
      throw new Error(`${key} must contain at least 32 characters`);
    }
    return secret;
  }

  private getPositiveInteger(key: string, fallback: number) {
    const value = Number(
      this.configService.get<string | number>(key, fallback),
    );
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }
    return value;
  }

  private accountConflict() {
    return new ConflictException({
      code: 'ACCOUNT_ALREADY_EXISTS',
      message: '用户名或邮箱已被注册',
    });
  }

  private invalidRefreshToken() {
    return new UnauthorizedException({
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Refresh Token 无效或已过期',
    });
  }
}
