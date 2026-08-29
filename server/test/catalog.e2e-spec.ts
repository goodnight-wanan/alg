import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import sharp from 'sharp';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { MediaStorageService } from '../src/catalog/media-storage.service.js';

describe('Catalog management (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const created = {
    userId: '',
    crudUserId: '',
    artistId: '',
    avatarArtistId: '',
    albumId: '',
    categoryId: '',
    songId: '',
    playlistId: '',
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET =
      'test-access-secret-with-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-with-at-least-32-characters';
    process.env.REMOTE_AUDIO_HOSTS = 'cdn.example.com';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('protects admin routes and manages a published remote song', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const username = `catalog_${suffix}`.slice(0, 32);
    const email = `catalog-${suffix}@example.com`;
    const password = 'catalog-password-123';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, email, password })
      .expect(201);
    created.userId = registerResponse.body.user.id;

    await request(app.getHttpServer())
      .post('/api/admin/artists')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({ name: 'Unauthorized Artist' })
      .expect(403);

    await prisma.user.update({
      where: { id: created.userId },
      data: { role: UserRole.ADMIN },
    });

    const artistResponse = await request(app.getHttpServer())
      .post('/api/admin/artists')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({ name: `Artist ${suffix}`, region: '内地' })
      .expect(201);
    created.artistId = artistResponse.body.id;
    expect(artistResponse.body.region).toBe('内地');

    const avatarBuffer = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 4,
        background: { r: 233, g: 78, b: 119, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const avatarArtistResponse = await request(app.getHttpServer())
      .post('/api/admin/artists')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .field('name', `Avatar Artist ${suffix}`)
      .field('region', '欧美')
      .attach('avatar', avatarBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      .expect(201);
    created.avatarArtistId = avatarArtistResponse.body.id;
    expect(avatarArtistResponse.body.avatarAssetId).toBeTruthy();

    await request(app.getHttpServer())
      .get('/api/artists')
      .expect(200)
      .expect(({ body }) => {
        const item = body.find(
          (candidate: { id: string }) =>
            candidate.id === created.avatarArtistId,
        );
        expect(item).toBeTruthy();
        expect(item.avatarUrl).toMatch(/^\/api\/assets\//);
      });

    const categoryResponse = await request(app.getHttpServer())
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({
        name: `Category ${suffix}`,
        slug: `category-${suffix}`.slice(0, 60),
        type: 'GENRE',
      })
      .expect(201);
    created.categoryId = categoryResponse.body.id;

    const albumResponse = await request(app.getHttpServer())
      .post('/api/admin/albums')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({ title: `Album ${suffix}`, artistId: created.artistId })
      .expect(201);
    created.albumId = albumResponse.body.id;

    const songResponse = await request(app.getHttpServer())
      .post('/api/admin/songs')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({
        title: `Song ${suffix}`,
        artistId: created.artistId,
        albumId: created.albumId,
        categoryIds: [created.categoryId],
        sourceType: 'REMOTE',
        remoteUrl: 'https://cdn.example.com/audio/song.mp3',
        status: 'PUBLISHED',
      })
      .expect(201);
    created.songId = songResponse.body.id;

    const playlist = await prisma.playlist.create({
      data: {
        publicId: `playlist-${suffix}`.slice(0, 64),
        title: `Playlist ${suffix}`,
        isPublished: true,
        songs: {
          create: { songId: created.songId, position: 1 },
        },
      },
    });
    created.playlistId = playlist.id;

    await request(app.getHttpServer())
      .get('/api/playlists')
      .expect(200)
      .expect(({ body }) => {
        const item = body.find(
          (candidate: { publicId: string }) =>
            candidate.publicId === playlist.publicId,
        );
        expect(item.songCount).toBe(1);
        expect(item.songs[0].publicId).toBe(songResponse.body.publicId);
      });

    await request(app.getHttpServer())
      .get(`/api/playlists/${playlist.publicId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe(`Playlist ${suffix}`);
      });

    await request(app.getHttpServer())
      .post('/api/admin/songs')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({
        title: 'Blocked remote song',
        artistId: created.artistId,
        sourceType: 'REMOTE',
        remoteUrl: 'http://127.0.0.1/private.mp3',
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.code).toBe('REMOTE_AUDIO_HOST_NOT_ALLOWED');
      });

    await request(app.getHttpServer())
      .get(`/api/songs/${songResponse.body.publicId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe(`Song ${suffix}`);
        expect(body.categories).toHaveLength(1);
        expect(body).not.toHaveProperty('remoteUrl');
      });

    await request(app.getHttpServer())
      .get(`/api/audio/${songResponse.body.publicId}`)
      .expect(302)
      .expect('Location', 'https://cdn.example.com/audio/song.mp3');

    await request(app.getHttpServer())
      .patch(`/api/admin/songs/${created.songId}`)
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({ title: `Updated Song ${suffix}` })
      .expect(200)
      .expect(({ body }) => {
        expect(body.title).toBe(`Updated Song ${suffix}`);
      });

    await request(app.getHttpServer())
      .patch(`/api/admin/songs/${created.songId}/status`)
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({ status: 'UNPUBLISHED' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/songs/${songResponse.body.publicId}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch('/api/admin/songs/batch/status')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({ ids: [created.songId], status: 'PUBLISHED' })
      .expect(200)
      .expect({ updated: 1 });

    await request(app.getHttpServer())
      .delete('/api/admin/songs/batch')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({ ids: [created.songId] })
      .expect(200)
      .expect({ deleted: 1 });
    created.songId = '';
  });

  it('manages artist, category and album records', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const username = `catalog_crud_${suffix}`.slice(0, 32);
    const email = `catalog-crud-${suffix}@example.com`;
    const password = 'catalog-crud-password-123';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, email, password })
      .expect(201);
    created.crudUserId = registerResponse.body.user.id;
    await prisma.user.update({
      where: { id: created.crudUserId },
      data: { role: UserRole.ADMIN },
    });
    const authorization = `Bearer ${registerResponse.body.accessToken}`;

    const artistResponse = await request(app.getHttpServer())
      .post('/api/admin/artists')
      .set('Authorization', authorization)
      .send({ name: `Crud Artist ${suffix}`, region: '日本' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/admin/artists/${artistResponse.body.id}`)
      .set('Authorization', authorization)
      .send({ name: `Crud Artist Updated ${suffix}`, region: '韩国' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe(`Crud Artist Updated ${suffix}`);
        expect(body.region).toBe('韩国');
      });

    const categoryResponse = await request(app.getHttpServer())
      .post('/api/admin/categories')
      .set('Authorization', authorization)
      .send({
        name: `Crud Mood ${suffix}`,
        slug: `mood-crud-${suffix}`.slice(0, 60),
        type: 'MOOD',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/admin/categories/${categoryResponse.body.id}`)
      .set('Authorization', authorization)
      .send({ name: `Crud Mood Updated ${suffix}`, type: 'GENRE' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe(`Crud Mood Updated ${suffix}`);
        expect(body.type).toBe('GENRE');
      });

    const albumResponse = await request(app.getHttpServer())
      .post('/api/admin/albums')
      .set('Authorization', authorization)
      .send({ title: `Crud Album ${suffix}`, artistId: artistResponse.body.id })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/admin/albums/${albumResponse.body.id}`)
      .set('Authorization', authorization)
      .expect(200)
      .expect({ deleted: true });

    await request(app.getHttpServer())
      .delete(`/api/admin/artists/${artistResponse.body.id}`)
      .set('Authorization', authorization)
      .expect(200)
      .expect({ deleted: true });

    await request(app.getHttpServer())
      .delete(`/api/admin/categories/${categoryResponse.body.id}`)
      .set('Authorization', authorization)
      .expect(200)
      .expect({ deleted: true });

    await request(app.getHttpServer())
      .delete(`/api/admin/artists/${created.artistId}`)
      .set('Authorization', authorization)
      .expect(400)
      .expect(({ body }) => {
        expect(body.code).toBe('ARTIST_IN_USE');
      });
  });

  afterAll(async () => {
    if (created.playlistId) {
      await prisma.playlist.deleteMany({ where: { id: created.playlistId } });
    }
    if (created.songId) {
      await prisma.song.deleteMany({ where: { id: created.songId } });
    }
    if (created.albumId) {
      await prisma.album.deleteMany({ where: { id: created.albumId } });
    }
    if (created.categoryId) {
      await prisma.category.deleteMany({ where: { id: created.categoryId } });
    }
    if (created.artistId) {
      await prisma.artist.deleteMany({ where: { id: created.artistId } });
    }
    if (created.avatarArtistId) {
      const artist = await prisma.artist.findUnique({
        where: { id: created.avatarArtistId },
        select: { avatarAsset: true },
      });
      await prisma.artist.deleteMany({
        where: { id: created.avatarArtistId },
      });
      if (artist?.avatarAsset) {
        await prisma.fileAsset.deleteMany({
          where: { id: artist.avatarAsset.id },
        });
        await app
          .get(MediaStorageService)
          .removeAssets([{ storagePath: artist.avatarAsset.storagePath }]);
      }
    }
    if (created.userId) {
      await prisma.user.deleteMany({ where: { id: created.userId } });
    }
    if (created.crudUserId) {
      await prisma.user.deleteMany({ where: { id: created.crudUserId } });
    }
    await app?.close();
  });
});
