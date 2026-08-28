import { SongWithRelations } from './catalog.types.js';

function assetUrl(assetId?: string | null) {
  return assetId ? `/api/assets/${assetId}` : null;
}

export function presentSong(
  song: SongWithRelations,
  includeAdminFields = false,
) {
  const coverAsset = song.coverAsset ?? song.album?.coverAsset;
  const result = {
    id: song.id,
    publicId: song.publicId,
    title: song.title,
    sourceType: song.sourceType,
    status: song.status,
    durationSeconds: song.durationSeconds,
    bitrateKbps: song.bitrateKbps,
    playCount: song.playCount,
    publishedAt: song.publishedAt,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
    audioUrl: `/api/audio/${song.publicId}`,
    coverUrl: assetUrl(coverAsset?.id),
    artist: {
      id: song.artist.id,
      publicId: song.artist.publicId,
      name: song.artist.name,
      avatarUrl: assetUrl(song.artist.avatarAssetId),
    },
    album: song.album
      ? {
          id: song.album.id,
          publicId: song.album.publicId,
          title: song.album.title,
          coverUrl: assetUrl(song.album.coverAssetId),
          releaseDate: song.album.releaseDate,
        }
      : null,
    categories: song.categories.map(({ category }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
  };

  return includeAdminFields
    ? {
        ...result,
        remoteUrl: song.remoteUrl,
        audioAsset: song.audioAsset,
        coverAsset: song.coverAsset,
      }
    : result;
}
