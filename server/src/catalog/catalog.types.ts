import { Prisma } from '@prisma/client';

export const songRelations = {
  artist: true,
  album: {
    include: {
      coverAsset: true,
    },
  },
  audioAsset: true,
  coverAsset: true,
  categories: {
    include: {
      category: true,
    },
  },
} satisfies Prisma.SongInclude;

export type SongWithRelations = Prisma.SongGetPayload<{
  include: typeof songRelations;
}>;

export const playlistRelations = {
  coverAsset: true,
  categories: {
    include: { category: true },
  },
  songs: {
    include: { song: { include: songRelations } },
    orderBy: { position: 'asc' as const },
  },
} satisfies Prisma.PlaylistInclude;

export type PlaylistWithSongs = Prisma.PlaylistGetPayload<{
  include: typeof playlistRelations;
}>;

export interface UploadedSongFiles {
  audio?: Express.Multer.File[];
  cover?: Express.Multer.File[];
}

export interface UploadedArtistFiles {
  avatar?: Express.Multer.File[];
}

export interface UploadedAlbumFiles {
  cover?: Express.Multer.File[];
}

export interface UploadedPlaylistFiles {
  cover?: Express.Multer.File[];
}
