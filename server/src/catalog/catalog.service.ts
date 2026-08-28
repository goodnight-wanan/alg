import { Injectable, NotFoundException } from '@nestjs/common';
import { FileAssetKind, Prisma, SongStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { presentSong } from './catalog.presenter.js';
import { songRelations } from './catalog.types.js';
import { PaginationQueryDto } from './dto/catalog.dto.js';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listSongs(query: PaginationQueryDto) {
    const where: Prisma.SongWhereInput = {
      status: SongStatus.PUBLISHED,
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
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.pageSize,
      }),
      this.prisma.song.count({ where }),
    ]);

    return {
      items: songs.map((song) => presentSong(song)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async getSong(publicId: string) {
    const song = await this.prisma.song.findFirst({
      where: { publicId, status: SongStatus.PUBLISHED },
      include: songRelations,
    });

    if (!song) {
      throw new NotFoundException({
        code: 'SONG_NOT_FOUND',
        message: '歌曲不存在或尚未上架',
      });
    }

    return presentSong(song);
  }

  async getPlayableSong(publicId: string) {
    const song = await this.prisma.song.findFirst({
      where: { publicId, status: SongStatus.PUBLISHED },
      select: {
        id: true,
        publicId: true,
        sourceType: true,
        remoteUrl: true,
        audioAsset: true,
      },
    });

    if (!song) {
      throw new NotFoundException({
        code: 'SONG_NOT_FOUND',
        message: '歌曲不存在或尚未上架',
      });
    }

    return song;
  }

  async getAdminPlayableSong(id: string) {
    const song = await this.prisma.song.findUnique({
      where: { id },
      select: {
        id: true,
        publicId: true,
        sourceType: true,
        remoteUrl: true,
        audioAsset: true,
      },
    });

    if (!song) {
      throw new NotFoundException({
        code: 'SONG_NOT_FOUND',
        message: '歌曲不存在',
      });
    }

    return song;
  }

  incrementPlayCount(id: string) {
    return this.prisma.song.update({
      where: { id },
      data: { playCount: { increment: 1 } },
      select: { id: true },
    });
  }

  async getPublicAsset(id: string) {
    const asset = await this.prisma.fileAsset.findUnique({ where: { id } });
    if (!asset || asset.kind === FileAssetKind.AUDIO) {
      throw new NotFoundException({
        code: 'ASSET_NOT_FOUND',
        message: '图片资源不存在',
      });
    }
    return asset;
  }

  async listArtists() {
    const artists = await this.prisma.artist.findMany({
      include: { avatarAsset: true, _count: { select: { songs: true } } },
      orderBy: { name: 'asc' },
    });
    return artists.map((artist) => ({
      id: artist.id,
      publicId: artist.publicId,
      name: artist.name,
      biography: artist.biography,
      avatarUrl: artist.avatarAsset
        ? `/api/assets/${artist.avatarAsset.id}`
        : null,
      songCount: artist._count.songs,
    }));
  }

  async listAlbums() {
    const albums = await this.prisma.album.findMany({
      include: {
        artist: true,
        coverAsset: true,
        _count: { select: { songs: true } },
      },
      orderBy: [{ releaseDate: 'desc' }, { title: 'asc' }],
    });
    return albums.map((album) => ({
      id: album.id,
      publicId: album.publicId,
      title: album.title,
      releaseDate: album.releaseDate,
      description: album.description,
      coverUrl: album.coverAsset ? `/api/assets/${album.coverAsset.id}` : null,
      artist: {
        id: album.artist.id,
        publicId: album.artist.publicId,
        name: album.artist.name,
      },
      songCount: album._count.songs,
    }));
  }

  listCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async listPlaylists() {
    const playlists = await this.prisma.playlist.findMany({
      where: { isPublished: true },
      include: {
        coverAsset: true,
        songs: {
          where: { song: { status: SongStatus.PUBLISHED } },
          include: { song: { include: songRelations } },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { title: 'asc' }],
    });
    return playlists.map((playlist) => this.presentPlaylist(playlist));
  }

  async getPlaylist(publicId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { publicId, isPublished: true },
      include: {
        coverAsset: true,
        songs: {
          where: { song: { status: SongStatus.PUBLISHED } },
          include: { song: { include: songRelations } },
          orderBy: { position: 'asc' },
        },
      },
    });
    if (!playlist) {
      throw new NotFoundException({
        code: 'PLAYLIST_NOT_FOUND',
        message: '歌单不存在或尚未发布',
      });
    }
    return this.presentPlaylist(playlist);
  }

  private presentPlaylist(
    playlist: Prisma.PlaylistGetPayload<{
      include: {
        coverAsset: true;
        songs: {
          include: { song: { include: typeof songRelations } };
        };
      };
    }>,
  ) {
    return {
      id: playlist.id,
      publicId: playlist.publicId,
      title: playlist.title,
      description: playlist.description,
      genre: playlist.genre,
      mood: playlist.mood,
      era: playlist.era,
      coverUrl: playlist.coverAsset
        ? `/api/assets/${playlist.coverAsset.id}`
        : null,
      songCount: playlist.songs.length,
      songs: playlist.songs.map(({ song }) => presentSong(song)),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };
  }
}
