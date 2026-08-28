import { randomUUID } from 'node:crypto';
import {
  Controller,
  Get,
  INestApplication,
  Module,
  UseGuards,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/app.setup.js';
import { AuthModule } from '../src/auth/auth.module.js';
import { Roles } from '../src/auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/auth/guards/roles.guard.js';
import { PrismaModule } from '../src/database/prisma.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

@Controller('test')
class AdminProbeController {
  @Get('admin')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  checkAdminAccess() {
    return { allowed: true };
  }
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
  controllers: [AdminProbeController],
})
class AuthE2eModule {}

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET =
      'test-access-secret-with-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-with-at-least-32-characters';
    process.env.JWT_ACCESS_TTL_SECONDS = '900';
    process.env.JWT_REFRESH_TTL_SECONDS = '604800';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthE2eModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    jwtService = app.get(JwtService);
    prisma = app.get(PrismaService);
  });

  it('completes registration, login, refresh rotation and logout', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const username = `user_${suffix}`.slice(0, 32);
    const email = `user-${suffix}@example.com`;
    const password = 'music-password-123';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, email, password })
      .expect(201);

    createdUserIds.push(registerResponse.body.user.id);
    expect(registerResponse.body.user).not.toHaveProperty('passwordHash');
    expect(registerResponse.body.accessToken).toEqual(expect.any(String));
    expect(registerResponse.body.refreshToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, email: `duplicate-${email}`, password })
      .expect(409)
      .expect(({ body }) => {
        expect(body.code).toBe('ACCOUNT_ALREADY_EXISTS');
      });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ account: email, password: 'wrong-password' })
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('INVALID_CREDENTIALS');
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ account: username.toUpperCase(), password })
      .expect(200);

    await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.email).toBe(email);
        expect(body.user).not.toHaveProperty('passwordHash');
      });

    await request(app.getHttpServer())
      .get('/api/test/admin')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(403)
      .expect(({ body }) => {
        expect(body.code).toBe('INSUFFICIENT_ROLE');
      });

    await prisma.user.update({
      where: { id: registerResponse.body.user.id },
      data: { role: UserRole.ADMIN },
    });

    await request(app.getHttpServer())
      .get('/api/test/admin')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200)
      .expect({ allowed: true });

    await prisma.user.update({
      where: { id: registerResponse.body.user.id },
      data: { status: UserStatus.DISABLED },
    });

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('ACCOUNT_DISABLED');
      });

    await prisma.user.update({
      where: { id: registerResponse.body.user.id },
      data: { status: UserStatus.ACTIVE },
    });

    const expiredAccessToken = await jwtService.signAsync(
      { sub: registerResponse.body.user.id, type: 'access' },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: -1,
      },
    );

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredAccessToken}`)
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('INVALID_ACCESS_TOKEN');
      });

    const expiredRefreshToken = await jwtService.signAsync(
      { sub: registerResponse.body.user.id, type: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: -1,
        jwtid: randomUUID(),
      },
    );

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: expiredRefreshToken })
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('INVALID_REFRESH_TOKEN');
      });

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: loginResponse.body.refreshToken })
      .expect(200);

    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken,
    );

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: loginResponse.body.refreshToken })
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('INVALID_REFRESH_TOKEN');
      });

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .send({ refreshToken: refreshResponse.body.refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshResponse.body.refreshToken })
      .expect(401);

    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { id: registerResponse.body.user.id },
    });
    const storedTokens = await prisma.refreshToken.findMany({
      where: { userId: storedUser.id },
    });

    expect(storedUser.passwordHash).not.toBe(password);
    expect(storedTokens.length).toBeGreaterThanOrEqual(3);
    expect(storedTokens.every((token) => token.tokenHash.length === 64)).toBe(
      true,
    );
  });

  afterAll(async () => {
    if (prisma && createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await app?.close();
  });
});
