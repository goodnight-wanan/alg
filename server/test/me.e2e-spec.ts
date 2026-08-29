import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SongSourceType, SongStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import sharp from 'sharp';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('User library (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let mediaRoot = '';
  const created = {
    userIds: [] as string[],
    artistId: '',
    songId: '',
    songPublicId: '',
    playlistId: '',
    playlistPublicId: '',
    avatarAssetId: '',
  };

  beforeAll(async () => {
    mediaRoot = await mkdtemp(join(tmpdir(), 'music-site-me-'));
    process.env.MEDIA_ROOT = mediaRoot;
    process.env.JWT_ACCESS_SECRET =
      'test-access-secret-with-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-with-at-least-32-characters';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('persists favorites, owned playlists, history and profile changes', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const password = 'music-password-123';
    const nextPassword = 'music-password-456';
    const register = async (prefix: string) => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: `${prefix}_${suffix}`.slice(0, 32),
          email: `${prefix}-${suffix}@example.com`,
          password,
        })
        .expect(201);
      created.userIds.push(response.body.user.id);
      return response.body;
    };

    const owner = await register('owner');
    const other = await register('other');
    const auth = { Authorization: `Bearer ${owner.accessToken}` };

    await request(app.getHttpServer()).get('/api/me/favorite-songs').expect(401);

    const artist = await prisma.artist.create({
      data: {
        publicId: `artist-${randomUUID()}`,
        name: `Artist ${suffix}`,
      },
    });
    created.artistId = artist.id;
    const song = await prisma.song.create({
      data: {
        publicId: `song-${randomUUID()}`,
        title: `Song ${suffix}`,
        artistId: artist.id,
        sourceType: SongSourceType.REMOTE,
        remoteUrl: 'https://cdn.example.com/song.mp3',
        status: SongStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    created.songId = song.id;
    created.songPublicId = song.publicId;
    const officialPlaylist = await prisma.playlist.create({
      data: {
        publicId: `playlist-${randomUUID()}`,
        title: `Official ${suffix}`,
        isPublished: true,
        songs: { create: { songId: song.id, position: 1 } },
      },
    });
    created.playlistId = officialPlaylist.id;
    created.playlistPublicId = officialPlaylist.publicId;

    await request(app.getHttpServer())
      .post(`/api/me/favorite-songs/${song.publicId}`)
      .set(auth)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/me/favorite-songs/${song.publicId}`)
      .set(auth)
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/me/favorite-songs')
      .set(auth)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toHaveLength(1);
        expect(body.items[0].publicId).toBe(song.publicId);
      });

    await request(app.getHttpServer())
      .post(`/api/me/favorite-playlists/${officialPlaylist.publicId}`)
      .set(auth)
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/me/favorite-playlists')
      .set(auth)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items[0].publicId).toBe(officialPlaylist.publicId);
      });

    const userPlaylist = await request(app.getHttpServer())
      .post('/api/me/playlists')
      .set(auth)
      .send({ title: `My playlist ${suffix}`.slice(0, 30), songId: song.publicId })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/me/playlists')
      .set(auth)
      .send({ title: userPlaylist.body.title })
      .expect(409)
      .expect(({ body }) => {
        expect(body.code).toBe('PLAYLIST_TITLE_EXISTS');
      });

    await request(app.getHttpServer())
      .delete(`/api/me/playlists/${userPlaylist.body.id}`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/me/playlists/${userPlaylist.body.id}/songs/${song.publicId}`)
      .set(auth)
      .expect(201)
      .expect({ added: false, duplicate: true });

    await request(app.getHttpServer())
      .post(`/api/me/history/${song.publicId}`)
      .set(auth)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/me/history/${song.publicId}`)
      .set(auth)
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/me/history')
      .set(auth)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items[0].song.publicId).toBe(song.publicId);
        expect(body.items[0].playCount).toBe(2);
      });

    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set(auth)
      .send({ nickname: '悦音用户' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.nickname).toBe('悦音用户');
      });

    const avatar = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: '#ff7eb3',
      },
    })
      .webp()
      .toBuffer();
    const avatarResponse = await request(app.getHttpServer())
      .post('/api/me/avatar')
      .set(auth)
      .attach('avatar', avatar, {
        filename: 'avatar.webp',
        contentType: 'image/webp',
      })
      .expect(201);
    expect(avatarResponse.body.user.avatarUrl).toMatch(/^\/api\/assets\//);
    created.avatarAssetId = avatarResponse.body.user.avatarUrl.split('/').at(-1);

    await request(app.getHttpServer())
      .patch('/api/me/password')
      .set(auth)
      .send({ currentPassword: 'wrong-password', newPassword: nextPassword })
      .expect(401);
    await request(app.getHttpServer())
      .patch('/api/me/password')
      .set(auth)
      .send({ currentPassword: password, newPassword: nextPassword })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: owner.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ account: owner.user.email, password: nextPassword })
      .expect(200);
  });

  afterAll(async () => {
    if (created.userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: created.userIds } } });
    }
    if (created.avatarAssetId) {
      await prisma.fileAsset.deleteMany({ where: { id: created.avatarAssetId } });
    }
    if (created.playlistId) {
      await prisma.playlist.deleteMany({ where: { id: created.playlistId } });
    }
    if (created.songId) {
      await prisma.song.deleteMany({ where: { id: created.songId } });
    }
    if (created.artistId) {
      await prisma.artist.deleteMany({ where: { id: created.artistId } });
    }
    await app?.close();
    if (mediaRoot) {
      await rm(mediaRoot, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  });
});
