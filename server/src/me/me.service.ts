import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, SongStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { presentPlaylist, presentSong } from '../catalog/catalog.presenter.js';
import {
  playlistRelations,
  songRelations,
} from '../catalog/catalog.types.js';
import { MediaStorageService } from '../catalog/media-storage.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { publicUserSelect } from '../users/user.types.js';
import {
  ChangePasswordDto,
  CreateUserPlaylistDto,
  MePaginationQueryDto,
  UpdateProfileDto,
  UpdateUserPlaylistDto,
} from './dto/me.dto.js';

const PASSWORD_HASH_ROUNDS = 12;

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
    if (!user) throw this.userNotFound();
    return { user };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { nickname: dto.nickname },
      select: publicUserSelect,
    });
    return { user };
  }

  async updateAvatar(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        code: 'AVATAR_REQUIRED',
        message: '请选择头像图片',
      });
    }

    const processed = await this.mediaStorage.processAvatar(file);
    let result;
    try {
      result = await this.prisma.$transaction(async (transaction) => {
        const currentUser = await transaction.user.findUnique({
          where: { id: userId },
          select: { avatarAsset: true },
        });
        if (!currentUser) throw this.userNotFound();

        const asset = await transaction.fileAsset.create({
          data: processed.data,
        });
        const user = await transaction.user.update({
          where: { id: userId },
          data: {
            avatarAssetId: asset.id,
            avatarUrl: `/api/assets/${asset.id}`,
          },
          select: publicUserSelect,
        });
        return { user, previousAsset: currentUser.avatarAsset };
      });

    } catch (error) {
      await this.mediaStorage.removeAssets([
        { storagePath: processed.data.storagePath },
      ]);
      throw error;
    }

    const previousAsset = result.previousAsset;
    if (previousAsset) {
      await this.prisma.fileAsset
        .delete({ where: { id: previousAsset.id } })
        .then(() => this.mediaStorage.removeAssets([previousAsset]))
        .catch(() => undefined);
    }
    return { user: result.user };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw this.userNotFound();
    if (!(await compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException({
        code: 'INVALID_CURRENT_PASSWORD',
        message: '当前密码不正确',
      });
    }
    if (await compare(dto.newPassword, user.passwordHash)) {
      throw new BadRequestException({
        code: 'PASSWORD_UNCHANGED',
        message: '新密码不能与当前密码相同',
      });
    }

    const passwordHash = await hash(dto.newPassword, PASSWORD_HASH_ROUNDS);
    const revokedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt },
      }),
    ]);
    return { message: '密码修改成功，请重新登录' };
  }

  async listFavoriteSongs(userId: string, query: MePaginationQueryDto) {
    const where: Prisma.FavoriteSongWhereInput = {
      userId,
      song: { status: SongStatus.PUBLISHED },
    };
    const skip = (query.page - 1) * query.pageSize;
    const [favorites, total] = await this.prisma.$transaction([
      this.prisma.favoriteSong.findMany({
        where,
        include: { song: { include: songRelations } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      this.prisma.favoriteSong.count({ where }),
    ]);
    return this.paginated(
      favorites.map(({ song }) => presentSong(song)),
      query,
      total,
    );
  }

  async addFavoriteSong(userId: string, publicId: string) {
    const song = await this.findPublishedSong(publicId);
    await this.prisma.favoriteSong.upsert({
      where: { userId_songId: { userId, songId: song.id } },
      create: { userId, songId: song.id },
      update: {},
    });
    return { favorite: true };
  }

  async removeFavoriteSong(userId: string, publicId: string) {
    const song = await this.findPublishedSong(publicId);
    await this.prisma.favoriteSong.deleteMany({
      where: { userId, songId: song.id },
    });
    return { favorite: false };
  }

  async listFavoritePlaylists(userId: string, query: MePaginationQueryDto) {
    const where: Prisma.FavoritePlaylistWhereInput = {
      userId,
      playlist: { isPublished: true, ownerId: null },
    };
    const skip = (query.page - 1) * query.pageSize;
    const [favorites, total] = await this.prisma.$transaction([
      this.prisma.favoritePlaylist.findMany({
        where,
        include: {
          playlist: {
            include: {
              ...playlistRelations,
              songs: {
                ...playlistRelations.songs,
                where: { song: { status: SongStatus.PUBLISHED } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      this.prisma.favoritePlaylist.count({ where }),
    ]);
    return this.paginated(
      favorites.map(({ playlist }) => presentPlaylist(playlist)),
      query,
      total,
    );
  }

  async addFavoritePlaylist(userId: string, publicId: string) {
    const playlist = await this.findPublishedPlaylist(publicId);
    await this.prisma.favoritePlaylist.upsert({
      where: { userId_playlistId: { userId, playlistId: playlist.id } },
      create: { userId, playlistId: playlist.id },
      update: {},
    });
    return { favorite: true };
  }

  async removeFavoritePlaylist(userId: string, publicId: string) {
    const playlist = await this.findPublishedPlaylist(publicId);
    await this.prisma.favoritePlaylist.deleteMany({
      where: { userId, playlistId: playlist.id },
    });
    return { favorite: false };
  }

  async listPlaylists(userId: string) {
    const playlists = await this.prisma.playlist.findMany({
      where: { ownerId: userId },
      include: {
        ...playlistRelations,
        songs: {
          ...playlistRelations.songs,
          where: { song: { status: SongStatus.PUBLISHED } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return playlists.map((playlist) => presentPlaylist(playlist));
  }

  async createPlaylist(userId: string, dto: CreateUserPlaylistDto) {
    await this.assertUniquePlaylistTitle(userId, dto.title);
    const song = dto.songId
      ? await this.findPublishedSong(dto.songId)
      : undefined;
    const playlist = await this.prisma.playlist.create({
      data: {
        publicId: `user-${randomUUID()}`,
        title: dto.title,
        description: dto.description,
        ownerId: userId,
        isPublished: false,
        ...(song
          ? { songs: { create: { songId: song.id, position: 1 } } }
          : {}),
      },
      include: playlistRelations,
    });
    return presentPlaylist(playlist);
  }

  async updatePlaylist(
    userId: string,
    playlistId: string,
    dto: UpdateUserPlaylistDto,
  ) {
    if (dto.title === undefined && dto.description === undefined) {
      throw new BadRequestException({
        code: 'EMPTY_UPDATE',
        message: '请至少提供一项要修改的歌单信息',
      });
    }
    await this.findOwnedPlaylist(userId, playlistId);
    if (dto.title) {
      await this.assertUniquePlaylistTitle(userId, dto.title, playlistId);
    }
    const playlist = await this.prisma.playlist.update({
      where: { id: playlistId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
      },
      include: playlistRelations,
    });
    return presentPlaylist(playlist);
  }

  async deletePlaylist(userId: string, playlistId: string) {
    const result = await this.prisma.playlist.deleteMany({
      where: { id: playlistId, ownerId: userId },
    });
    if (result.count !== 1) throw this.playlistNotFound();
    return { deleted: true };
  }

  async addPlaylistSong(
    userId: string,
    playlistId: string,
    publicId: string,
  ) {
    await this.findOwnedPlaylist(userId, playlistId);
    const song = await this.findPublishedSong(publicId);
    const existing = await this.prisma.playlistSong.findUnique({
      where: { playlistId_songId: { playlistId, songId: song.id } },
    });
    if (existing) return { added: false, duplicate: true };

    const lastSong = await this.prisma.playlistSong.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    await this.prisma.playlistSong.create({
      data: {
        playlistId,
        songId: song.id,
        position: (lastSong?.position ?? 0) + 1,
      },
    });
    return { added: true, duplicate: false };
  }

  async removePlaylistSong(
    userId: string,
    playlistId: string,
    publicId: string,
  ) {
    await this.findOwnedPlaylist(userId, playlistId);
    const song = await this.findPublishedSong(publicId);
    const result = await this.prisma.playlistSong.deleteMany({
      where: { playlistId, songId: song.id },
    });
    return { removed: result.count > 0 };
  }

  async listHistory(userId: string, query: MePaginationQueryDto) {
    const where: Prisma.PlayHistoryWhereInput = {
      userId,
      song: { status: SongStatus.PUBLISHED },
    };
    const skip = (query.page - 1) * query.pageSize;
    const [history, total] = await this.prisma.$transaction([
      this.prisma.playHistory.findMany({
        where,
        include: { song: { include: songRelations } },
        orderBy: { lastPlayedAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      this.prisma.playHistory.count({ where }),
    ]);
    return this.paginated(
      history.map((item) => ({
        song: presentSong(item.song),
        playCount: item.playCount,
        firstPlayedAt: item.firstPlayedAt,
        lastPlayedAt: item.lastPlayedAt,
      })),
      query,
      total,
    );
  }

  async recordHistory(userId: string, publicId: string) {
    const song = await this.findPublishedSong(publicId);
    const history = await this.prisma.playHistory.upsert({
      where: { userId_songId: { userId, songId: song.id } },
      create: { userId, songId: song.id },
      update: { playCount: { increment: 1 }, lastPlayedAt: new Date() },
      select: { playCount: true, lastPlayedAt: true },
    });
    return history;
  }

  async clearHistory(userId: string) {
    const result = await this.prisma.playHistory.deleteMany({
      where: { userId },
    });
    return { deleted: result.count };
  }

  private async findPublishedSong(publicId: string) {
    const song = await this.prisma.song.findFirst({
      where: { publicId, status: SongStatus.PUBLISHED },
      select: { id: true },
    });
    if (!song) {
      throw new NotFoundException({
        code: 'SONG_NOT_FOUND',
        message: '歌曲不存在或尚未上架',
      });
    }
    return song;
  }

  private async findPublishedPlaylist(publicId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { publicId, isPublished: true, ownerId: null },
      select: { id: true },
    });
    if (!playlist) throw this.playlistNotFound();
    return playlist;
  }

  private async findOwnedPlaylist(userId: string, playlistId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id: playlistId, ownerId: userId },
      select: { id: true },
    });
    if (!playlist) throw this.playlistNotFound();
    return playlist;
  }

  private async assertUniquePlaylistTitle(
    userId: string,
    title: string,
    excludedId?: string,
  ) {
    const duplicate = await this.prisma.playlist.findFirst({
      where: {
        ownerId: userId,
        title: { equals: title, mode: 'insensitive' },
        ...(excludedId ? { id: { not: excludedId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException({
        code: 'PLAYLIST_TITLE_EXISTS',
        message: '已存在同名歌单',
      });
    }
  }

  private paginated<T>(
    items: T[],
    query: MePaginationQueryDto,
    total: number,
  ) {
    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  private playlistNotFound() {
    return new NotFoundException({
      code: 'PLAYLIST_NOT_FOUND',
      message: '歌单不存在或无权操作',
    });
  }

  private userNotFound() {
    return new NotFoundException({
      code: 'USER_NOT_FOUND',
      message: '用户不存在',
    });
  }
}
