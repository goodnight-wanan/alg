import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SongSourceType, SongStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { presentSong } from './catalog.presenter.js';
import {
  songRelations,
  UploadedArtistFiles,
  UploadedSongFiles,
} from './catalog.types.js';
import {
  AdminSongQueryDto,
  BatchSongStatusDto,
  CreateAlbumDto,
  CreateArtistDto,
  CreateCategoryDto,
  CreateRemoteSongDto,
  UpdateSongDto,
  UpdateSongStatusDto,
  UploadSongDto,
  UpdateArtistDto,
  UpdateCategoryDto,
} from './dto/catalog.dto.js';
import {
  MediaStorageService,
  ProcessedAsset,
} from './media-storage.service.js';
import { RemoteAudioPolicyService } from './remote-audio-policy.service.js';

@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorageService,
    private readonly remoteAudioPolicy: RemoteAudioPolicyService,
  ) {}

  async listSongs(query: AdminSongQueryDto) {
    const where: Prisma.SongWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              {
                artist: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                album: {
                  title: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [songs, total] = await this.prisma.$transaction([
      this.prisma.song.findMany({
        where,
        include: songRelations,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      this.prisma.song.count({ where }),
    ]);

    return {
      items: songs.map((song) => presentSong(song, true)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async createArtist(dto: CreateArtistDto, files: UploadedArtistFiles = {}) {
    const avatarFile = files.avatar?.[0];
    let processedAvatar: ProcessedAsset | undefined;

    try {
      if (avatarFile) {
        processedAvatar =
          await this.mediaStorage.processArtistAvatar(avatarFile);
      }

      return await this.prisma.$transaction(async (transaction) => {
        const avatarAsset = processedAvatar
          ? await transaction.fileAsset.create({ data: processedAvatar.data })
          : undefined;

        return transaction.artist.create({
          data: {
            publicId: dto.publicId ?? this.publicId('artist'),
            name: dto.name,
            biography: dto.biography,
            region: dto.region,
            avatarAssetId: avatarAsset?.id,
          },
          include: { avatarAsset: true },
        });
      });
    } catch (error) {
      if (processedAvatar) {
        await this.mediaStorage.removeAssets([
          { storagePath: processedAvatar.data.storagePath },
        ]);
      }
      this.handlePrismaError(error, '歌手公开 ID 已存在');
    }
  }

  async updateArtist(
    id: string,
    dto: UpdateArtistDto,
    files: UploadedArtistFiles = {},
  ) {
    const existing = await this.prisma.artist.findUnique({
      where: { id },
      select: { id: true, avatarAsset: true },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'ARTIST_NOT_FOUND',
        message: '歌手不存在',
      });
    }

    const avatarFile = files.avatar?.[0];
    const processedAvatar = avatarFile
      ? await this.mediaStorage.processArtistAvatar(avatarFile)
      : undefined;

    try {
      const artist = await this.prisma.$transaction(async (transaction) => {
        const avatarAsset = processedAvatar
          ? await transaction.fileAsset.create({ data: processedAvatar.data })
          : undefined;

        return transaction.artist.update({
          where: { id },
          data: {
            name: dto.name,
            region:
              dto.region === undefined
                ? undefined
                : dto.region.trim() || null,
            biography:
              dto.biography === undefined
                ? undefined
                : dto.biography.trim() || null,
            avatarAssetId: avatarAsset?.id,
          },
          include: { avatarAsset: true },
        });
      });

      if (existing.avatarAsset && existing.avatarAsset.id !== artist.avatarAssetId) {
        await this.removeFileAsset(existing.avatarAsset);
      }
      return artist;
    } catch (error) {
      if (processedAvatar) {
        await this.mediaStorage.removeAssets([
          { storagePath: processedAvatar.data.storagePath },
        ]);
      }
      throw error;
    }
  }

  async deleteArtist(id: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id },
      select: {
        id: true,
        avatarAsset: true,
        _count: { select: { albums: true, songs: true } },
      },
    });
    if (!artist) {
      throw new NotFoundException({
        code: 'ARTIST_NOT_FOUND',
        message: '歌手不存在',
      });
    }
    if (artist._count.albums > 0 || artist._count.songs > 0) {
      throw new BadRequestException({
        code: 'ARTIST_IN_USE',
        message: '该歌手已有歌曲或专辑，请先删除或迁移相关内容',
      });
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.artist.delete({ where: { id } });
      if (artist.avatarAsset) {
        await transaction.fileAsset.delete({
          where: { id: artist.avatarAsset.id },
        });
      }
    });
    if (artist.avatarAsset) {
      await this.mediaStorage.removeAssets([artist.avatarAsset]);
    }
    return { deleted: true };
  }

  async createAlbum(dto: CreateAlbumDto) {
    await this.assertArtistExists(dto.artistId);
    try {
      return await this.prisma.album.create({
        data: {
          publicId: dto.publicId ?? this.publicId('album'),
          title: dto.title,
          artistId: dto.artistId,
          releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
          description: dto.description,
        },
        include: { artist: true, coverAsset: true },
      });
    } catch (error) {
      this.handlePrismaError(error, '专辑公开 ID 已存在');
    }
  }

  async deleteAlbum(id: string) {
    const album = await this.prisma.album.findUnique({
      where: { id },
      select: {
        id: true,
        coverAsset: true,
        _count: { select: { songs: true } },
      },
    });
    if (!album) {
      throw new NotFoundException({
        code: 'ALBUM_NOT_FOUND',
        message: '专辑不存在',
      });
    }
    if (album._count.songs > 0) {
      throw new BadRequestException({
        code: 'ALBUM_IN_USE',
        message: '该专辑仍包含歌曲，请先删除或迁移专辑中的歌曲',
      });
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.album.delete({ where: { id } });
      if (album.coverAsset) {
        await transaction.fileAsset.delete({
          where: { id: album.coverAsset.id },
        });
      }
    });
    if (album.coverAsset) {
      await this.mediaStorage.removeAssets([album.coverAsset]);
    }
    return { deleted: true };
  }

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (error) {
      this.handlePrismaError(error, '分类名称或别名已存在');
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          type: dto.type,
          description:
            dto.description === undefined
              ? undefined
              : dto.description.trim() || null,
        },
      });
    } catch (error) {
      this.handleCategoryUpdateError(error);
    }
  }

  async deleteCategory(id: string) {
    const result = await this.prisma.category.deleteMany({
      where: { id },
    });
    if (result.count !== 1) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: '分类不存在',
      });
    }
    return { deleted: true };
  }

  async createRemoteSong(dto: CreateRemoteSongDto) {
    if (dto.sourceType !== SongSourceType.REMOTE) {
      throw new BadRequestException({
        code: 'INVALID_SOURCE_TYPE',
        message: '普通创建接口仅支持 REMOTE 来源，LOCAL 请使用上传接口',
      });
    }

    this.remoteAudioPolicy.assertAllowed(dto.remoteUrl);
    await this.assertReferences(dto.artistId, dto.albumId, dto.categoryIds);

    try {
      const song = await this.prisma.song.create({
        data: {
          publicId: dto.publicId ?? this.publicId('song'),
          title: dto.title,
          artistId: dto.artistId,
          albumId: dto.albumId,
          sourceType: SongSourceType.REMOTE,
          remoteUrl: dto.remoteUrl,
          durationSeconds: dto.durationSeconds,
          bitrateKbps: dto.bitrateKbps,
          status: dto.status ?? SongStatus.DRAFT,
          publishedAt:
            dto.status === SongStatus.PUBLISHED ? new Date() : undefined,
          categories: this.categoryCreate(dto.categoryIds),
        },
        include: songRelations,
      });
      return presentSong(song, true);
    } catch (error) {
      this.handlePrismaError(error, '歌曲公开 ID 已存在');
    }
  }

  async uploadSong(dto: UploadSongDto, files: UploadedSongFiles) {
    const audioFile = files.audio?.[0];
    if (!audioFile) {
      throw new BadRequestException({
        code: 'AUDIO_REQUIRED',
        message: '请上传音频文件',
      });
    }

    await this.assertReferences(dto.artistId, dto.albumId, dto.categoryIds);
    const processedAssets: ProcessedAsset[] = [];

    try {
      const audio = await this.mediaStorage.processAudio(audioFile);
      processedAssets.push(audio);
      const coverFile = files.cover?.[0];
      const cover = coverFile
        ? await this.mediaStorage.processCover(coverFile)
        : undefined;
      if (cover) processedAssets.push(cover);

      const song = await this.prisma.$transaction(async (transaction) => {
        const audioAsset = await transaction.fileAsset.create({
          data: audio.data,
        });
        const coverAsset = cover
          ? await transaction.fileAsset.create({ data: cover.data })
          : undefined;

        return transaction.song.create({
          data: {
            publicId: dto.publicId ?? this.publicId('song'),
            title: dto.title,
            artistId: dto.artistId,
            albumId: dto.albumId,
            sourceType: SongSourceType.LOCAL,
            audioAssetId: audioAsset.id,
            coverAssetId: coverAsset?.id,
            durationSeconds: audio.durationSeconds,
            bitrateKbps: audio.bitrateKbps,
            status: dto.status ?? SongStatus.DRAFT,
            publishedAt:
              dto.status === SongStatus.PUBLISHED ? new Date() : undefined,
            categories: this.categoryCreate(dto.categoryIds),
          },
          include: songRelations,
        });
      });

      return presentSong(song, true);
    } catch (error) {
      await this.mediaStorage.removeAssets(
        processedAssets.map((asset) => ({
          storagePath: asset.data.storagePath,
        })),
      );
      this.handlePrismaError(error, '歌曲公开 ID 已存在');
    }
  }

  async updateSong(id: string, dto: UpdateSongDto) {
    const existing = await this.getAdminSong(id);
    const artistId = dto.artistId ?? existing.artistId;
    const albumId = dto.albumId ?? existing.albumId ?? undefined;
    await this.assertReferences(artistId, albumId, dto.categoryIds);

    if (dto.remoteUrl) {
      if (existing.sourceType !== SongSourceType.REMOTE) {
        throw new BadRequestException({
          code: 'LOCAL_SOURCE_IMMUTABLE',
          message: '本地歌曲不能改为远程音频地址',
        });
      }
      this.remoteAudioPolicy.assertAllowed(dto.remoteUrl);
    }

    const song = await this.prisma.song.update({
      where: { id },
      data: {
        title: dto.title,
        artistId: dto.artistId,
        albumId: dto.albumId,
        remoteUrl: dto.remoteUrl,
        categories:
          dto.categoryIds === undefined
            ? undefined
            : {
                deleteMany: {},
                ...this.categoryCreate(dto.categoryIds),
              },
      },
      include: songRelations,
    });
    return presentSong(song, true);
  }

  async updateSongStatus(id: string, dto: UpdateSongStatusDto) {
    await this.getAdminSong(id);
    const song = await this.prisma.song.update({
      where: { id },
      data: this.statusData(dto.status),
      include: songRelations,
    });
    return presentSong(song, true);
  }

  async updateManySongStatuses(dto: BatchSongStatusDto) {
    const result = await this.prisma.song.updateMany({
      where: { id: { in: dto.ids } },
      data: this.statusData(dto.status),
    });
    return { updated: result.count };
  }

  async deleteSong(id: string) {
    const song = await this.getAdminSong(id);
    const assets = [song.audioAsset, song.coverAsset].filter(
      (asset): asset is NonNullable<typeof asset> => Boolean(asset),
    );

    await this.prisma.$transaction(async (transaction) => {
      await transaction.song.delete({ where: { id } });
      if (assets.length) {
        await transaction.fileAsset.deleteMany({
          where: { id: { in: assets.map((asset) => asset.id) } },
        });
      }
    });
    await this.mediaStorage.removeAssets(assets);
    return { deleted: true };
  }

  async deleteManySongs(ids: string[]) {
    const songs = await this.prisma.song.findMany({
      where: { id: { in: ids } },
      include: { audioAsset: true, coverAsset: true },
    });
    const assets = songs.flatMap((song) =>
      [song.audioAsset, song.coverAsset].filter(
        (asset): asset is NonNullable<typeof asset> => Boolean(asset),
      ),
    );
    const assetIds = [...new Set(assets.map((asset) => asset.id))];

    const deleted = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.song.deleteMany({
        where: { id: { in: ids } },
      });
      if (assetIds.length) {
        await transaction.fileAsset.deleteMany({
          where: { id: { in: assetIds } },
        });
      }
      return result.count;
    });
    await this.mediaStorage.removeAssets(assets);
    return { deleted };
  }

  private async getAdminSong(id: string) {
    const song = await this.prisma.song.findUnique({
      where: { id },
      include: songRelations,
    });
    if (!song) {
      throw new NotFoundException({
        code: 'SONG_NOT_FOUND',
        message: '歌曲不存在',
      });
    }
    return song;
  }

  private async assertReferences(
    artistId: string,
    albumId?: string,
    categoryIds: string[] = [],
  ) {
    const [artist, album, categoryCount] = await Promise.all([
      this.prisma.artist.findUnique({
        where: { id: artistId },
        select: { id: true },
      }),
      albumId
        ? this.prisma.album.findUnique({
            where: { id: albumId },
            select: { id: true, artistId: true },
          })
        : null,
      categoryIds.length
        ? this.prisma.category.count({ where: { id: { in: categoryIds } } })
        : 0,
    ]);

    if (!artist) {
      throw new BadRequestException({
        code: 'ARTIST_NOT_FOUND',
        message: '所选歌手不存在',
      });
    }
    if (albumId && (!album || album.artistId !== artistId)) {
      throw new BadRequestException({
        code: 'ALBUM_ARTIST_MISMATCH',
        message: '所选专辑不存在或不属于该歌手',
      });
    }
    if (categoryCount !== categoryIds.length) {
      throw new BadRequestException({
        code: 'CATEGORY_NOT_FOUND',
        message: '一个或多个歌曲分类不存在',
      });
    }
  }

  private async assertArtistExists(artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });
    if (!artist) {
      throw new BadRequestException({
        code: 'ARTIST_NOT_FOUND',
        message: '所选歌手不存在',
      });
    }
  }

  private async removeFileAsset(asset: { id: string; storagePath: string }) {
    await this.prisma.fileAsset
      .delete({ where: { id: asset.id } })
      .then(() => this.mediaStorage.removeAssets([asset]))
      .catch(() => undefined);
  }

  private handleCategoryUpdateError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        code: 'RESOURCE_ALREADY_EXISTS',
        message: '分类名称或别名已存在',
      });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: '分类不存在',
      });
    }
    throw error;
  }

  private categoryCreate(categoryIds: string[] = []) {
    return categoryIds.length
      ? {
          create: categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        }
      : undefined;
  }

  private statusData(status: SongStatus): Prisma.SongUpdateManyMutationInput {
    return {
      status,
      publishedAt: status === SongStatus.PUBLISHED ? new Date() : null,
    };
  }

  private publicId(prefix: string) {
    return `${prefix}-${randomUUID()}`;
  }

  private handlePrismaError(error: unknown, conflictMessage: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        code: 'RESOURCE_ALREADY_EXISTS',
        message: conflictMessage,
      });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2003', 'P2025'].includes(error.code)
    ) {
      throw new BadRequestException({
        code: 'INVALID_RELATION',
        message: '关联的曲库数据不存在或无法使用',
      });
    }
    throw error;
  }
}
