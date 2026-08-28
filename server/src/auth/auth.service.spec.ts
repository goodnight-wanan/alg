import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const now = new Date('2026-08-28T00:00:00.000Z');
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    username: 'MusicUser',
    usernameNormalized: 'musicuser',
    email: 'music@example.com',
    passwordHash: '',
    nickname: null,
    avatarUrl: null,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  function createService() {
    const prisma = {
      user: {
        findFirst: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback) => callback(prisma)),
    };
    const usersService = {
      create: vi.fn(),
      findForAuthentication: vi.fn(),
      markLoggedIn: vi.fn(),
    };
    const jwtService = {
      signAsync: vi.fn(async (payload: { type: string }) =>
        payload.type === 'access' ? 'access-token' : 'refresh-token',
      ),
      verifyAsync: vi.fn(),
    };
    const configService = {
      get: vi.fn((key: string, fallback?: number) => {
        const values: Record<string, string | number> = {
          JWT_ACCESS_SECRET: 'a'.repeat(32),
          JWT_REFRESH_SECRET: 'r'.repeat(32),
          JWT_ACCESS_TTL_SECONDS: 900,
          JWT_REFRESH_TTL_SECONDS: 604800,
        };
        return values[key] ?? fallback;
      }),
    };

    return {
      prisma,
      usersService,
      jwtService,
      service: new AuthService(
        prisma as unknown as PrismaService,
        usersService as unknown as UsersService,
        jwtService as unknown as JwtService,
        configService as unknown as ConfigService,
      ),
    };
  }

  it('registers a user without persisting plaintext secrets', async () => {
    const { prisma, usersService, service } = createService();
    prisma.user.findFirst.mockResolvedValue(null);
    usersService.create.mockImplementation(async (data) => ({
      ...user,
      username: data.username,
      email: data.email,
    }));
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await service.register(
      {
        username: 'MusicUser',
        email: 'music@example.com',
        password: 'correct-password',
      },
      { deviceInfo: 'vitest', ipAddress: '127.0.0.1' },
    );

    const createdUser = usersService.create.mock.calls[0][0];
    const createdToken = prisma.refreshToken.create.mock.calls[0][0].data;

    expect(createdUser.passwordHash).not.toBe('correct-password');
    expect(createdUser.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(createdToken.tokenHash).not.toBe('refresh-token');
    expect(createdToken.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresIn: 900,
    });
  });

  it('rejects duplicate usernames or email addresses', async () => {
    const { prisma, service } = createService();
    prisma.user.findFirst.mockResolvedValue({ id: user.id });

    await expect(
      service.register(
        {
          username: user.username,
          email: user.email,
          password: 'correct-password',
        },
        {},
      ),
    ).rejects.toMatchObject({
      response: {
        code: 'ACCOUNT_ALREADY_EXISTS',
      },
    });
  });

  it('rejects an incorrect password', async () => {
    const { usersService, service } = createService();
    usersService.findForAuthentication.mockResolvedValue({
      ...user,
      passwordHash: await hash('correct-password', 4),
    });

    await expect(
      service.login({ account: user.email, password: 'wrong-password' }, {}),
    ).rejects.toMatchObject({
      response: {
        code: 'INVALID_CREDENTIALS',
      },
    });
  });
});
