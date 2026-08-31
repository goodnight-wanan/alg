import { reactive } from 'vue'
import { resolveApiResourceUrl } from '../api/catalog'

const fallbackCover = '/assets/imgs/homepage/song_list/list1.webp'

export const songs = reactive([])
export const playlists = reactive([])
export const artists = reactive([])
export const albums = reactive([])
export const categories = reactive({ genres: [], moods: [], eras: [], regions: [] })
export const homePlaylistTabs = reactive([
  { key: 'recommend', label: '为你推荐', ids: [] },
  { key: 'healing', label: '治愈放松', ids: [] },
  { key: 'rhythm', label: '节奏律动', ids: [] },
  { key: 'night', label: '夜间频道', ids: [] },
  { key: 'new', label: '本周新声', ids: [] }
])

function replaceArray(target, next) {
  target.splice(0, target.length, ...next)
}

function categoryValue(song, prefix) {
  return song.categories?.find((category) => category.slug.startsWith(`${prefix}-`))?.name || ''
}

function categoryGroup(rawCategory) {
  if (rawCategory.type) return rawCategory.type
  const prefix = String(rawCategory.slug || '').split('-')[0]?.toUpperCase()
  return ['GENRE', 'MOOD', 'ERA', 'REGION', 'CHART', 'FEATURE'].includes(prefix)
    ? prefix
    : ''
}

function formatDuration(seconds) {
  const value = Number(seconds) || 0
  const minutes = Math.floor(value / 60)
  const remainder = Math.floor(value % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function normalizeSong(song) {
  const durationSeconds = Number(song.durationSeconds) || 0
  return {
    id: song.publicId,
    databaseId: song.id,
    publicId: song.publicId,
    title: song.title,
    artist: song.artist?.name || '未知歌手',
    artistPublicId: song.artist?.publicId || '',
    album: song.album?.title || '未收录专辑',
    albumPublicId: song.album?.publicId || '',
    cover: resolveApiResourceUrl(song.coverUrl) || fallbackCover,
    audio: resolveApiResourceUrl(song.audioUrl),
    duration: formatDuration(durationSeconds),
    durationSeconds,
    genre: categoryValue(song, 'genre'),
    mood: categoryValue(song, 'mood'),
    era: categoryValue(song, 'era'),
    region: categoryValue(song, 'region'),
    chart: categoryValue(song, 'chart') || '新歌榜',
    isNew: song.categories?.some((category) => category.slug === 'feature-new') || false,
    playCount: Number(song.playCount) || 0,
    publishedAt: song.publishedAt
  }
}

function normalizePlaylist(playlist, songById) {
  const playlistSongs = (playlist.songs || [])
    .map((song) => songById.get(song.publicId))
    .filter(Boolean)
  return {
    id: playlist.publicId,
    databaseId: playlist.id,
    publicId: playlist.publicId,
    title: playlist.title,
    description: playlist.description || '悦音精选歌单',
    cover: resolveApiResourceUrl(playlist.coverUrl) || playlistSongs[0]?.cover || fallbackCover,
    genre: playlist.genre || playlistSongs[0]?.genre || '流行',
    mood: playlist.mood || playlistSongs[0]?.mood || '治愈',
    era: playlist.era || playlistSongs[0]?.era || '20年代',
    songIds: playlistSongs.map((song) => song.id),
    songs: playlistSongs
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function hydrateCategories(rawCategories) {
  const groups = {
    genres: rawCategories
      .filter((item) => categoryGroup(item) === 'GENRE')
      .map((item) => item.name),
    moods: rawCategories
      .filter((item) => categoryGroup(item) === 'MOOD')
      .map((item) => item.name),
    eras: rawCategories
      .filter((item) => categoryGroup(item) === 'ERA')
      .map((item) => item.name),
    regions: rawCategories
      .filter((item) => categoryGroup(item) === 'REGION')
      .map((item) => item.name)
  }
  Object.entries(groups).forEach(([key, values]) => replaceArray(categories[key], unique(values)))
}

function hydrateHomeTabs() {
  const rules = {
    recommend: () => true,
    healing: (playlist) => ['治愈', '安静', '思念'].includes(playlist.mood),
    rhythm: (playlist) => ['电子音乐', '流行'].includes(playlist.genre) && playlist.mood !== '思念',
    night: (playlist) => ['安静', '思念'].includes(playlist.mood),
    new: (playlist) => playlist.id === 'playlist-new-release'
  }
  homePlaylistTabs.forEach((tab) => {
    const matches = playlists.filter(rules[tab.key] || rules.recommend)
    replaceArray(tab.ids, (matches.length ? matches : playlists).map((playlist) => playlist.id))
  })
}

export function hydrateCatalog(bundle) {
  const normalizedSongs = bundle.songs.map(normalizeSong)
  const songById = new Map(normalizedSongs.map((song) => [song.id, song]))
  const normalizedPlaylists = bundle.playlists.map((playlist) => normalizePlaylist(playlist, songById))
  const normalizedArtists = bundle.artists.map((artist) => {
    const artistSongs = normalizedSongs.filter((song) => song.artistPublicId === artist.publicId)
    return {
      id: artist.publicId,
      databaseId: artist.id,
      publicId: artist.publicId,
      name: artist.name,
      biography: artist.biography,
      cover: resolveApiResourceUrl(artist.avatarUrl) || artistSongs[0]?.cover || fallbackCover,
      region: artist.region || artistSongs[0]?.region || '',
      genre: unique(artistSongs.map((song) => song.genre)).join(' / '),
      songs: artistSongs,
      songCount: artistSongs.length
    }
  })
  const normalizedAlbums = bundle.albums.map((album) => ({
    id: album.publicId,
    databaseId: album.id,
    publicId: album.publicId,
    title: album.title,
    artist: album.artist?.name || '未知歌手',
    artistPublicId: album.artist?.publicId || '',
    cover: resolveApiResourceUrl(album.coverUrl) || fallbackCover,
    releaseDate: album.releaseDate,
    createdAt: album.createdAt,
    description: album.description,
    songs: normalizedSongs.filter((song) => song.albumPublicId === album.publicId)
  }))

  replaceArray(songs, normalizedSongs)
  replaceArray(playlists, normalizedPlaylists)
  replaceArray(artists, normalizedArtists)
  replaceArray(albums, normalizedAlbums)
  hydrateCategories(bundle.categories)
  hydrateHomeTabs()
}

export function getSongById(id) {
  return songs.find((song) => song.id === id)
}

export function getPlaylistById(id) {
  return playlists.find((playlist) => playlist.id === id)
}

export function getPlaylistSongs(playlist) {
  if (playlist?.songs?.length) return playlist.songs
  return (playlist?.songIds || []).map(getSongById).filter(Boolean)
}

export function getArtists() {
  return artists
}

export function getAlbums() {
  return albums
}

export function getAlbumById(id) {
  return albums.find((album) => album.id === id)
}
