<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlaylistById, getPlaylistSongs, getSongById } from '../data/catalogData'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { showNotice } from '../utils/notice'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const playlist = computed(() => {
  const catalogPlaylist = getPlaylistById(route.params.id)
  if (catalogPlaylist) return { ...catalogPlaylist, isCustom: false }

  const customPlaylist = userStore.customPlaylists.find((item) => item.id === route.params.id)
  if (!customPlaylist) return null

  const playlistSongs = customPlaylist.songIds.map(getSongById).filter(Boolean)
  return {
    ...customPlaylist,
    title: customPlaylist.name,
    description: `由 ${userStore.currentUser?.username || '用户'} 创建的自建歌单。`,
    cover: playlistSongs.at(-1)?.cover || '/assets/imgs/homepage/song_list/list1.webp',
    genre: '自建歌单',
    mood: `${playlistSongs.length} 首歌曲`,
    era: new Date(customPlaylist.createdAt).toLocaleDateString(),
    isCustom: true
  }
})
const songs = computed(() => getPlaylistSongs(playlist.value))
const currentSong = computed(() => playerStore.currentSong)
const isCustom = computed(() => Boolean(playlist.value?.isCustom))

const isFavorite = computed(() =>
  playlist.value ? userStore.isFavoritePlaylist(playlist.value.id) : false
)

const isPlayingList = computed(() => playerStore.isListActive(songs.value) && playerStore.isPlaying)

function playAll() {
  if (!songs.value.length) return
  playerStore.playSong(songs.value[0], songs.value)
}

function playSong(song) {
  playerStore.playSong(song, songs.value)
}

async function toggleFavorite() {
  if (!playlist.value || isCustom.value) return

  if (!userStore.isLoggedIn) {
    showNotice('请先登录后再收藏歌单')
    return
  }

  const result = await userStore.toggleFavoritePlaylist(playlist.value.id)
  showNotice(
    result.ok ? (result.added ? '歌单已收藏' : '已取消收藏歌单') : result.message,
    result.ok ? (result.added ? 'success' : 'info') : 'error'
  )
}

async function removeSong(songId) {
  if (!playlist.value || !isCustom.value) return
  const result = await userStore.removeSongFromCustomPlaylist(playlist.value.id, songId)
  showNotice(result.message, result.ok ? 'success' : 'error')
}

async function deletePlaylist() {
  if (!playlist.value || !isCustom.value) return
  if (!window.confirm('确定删除这个歌单吗？')) return
  const result = await userStore.deleteCustomPlaylist(playlist.value.id)
  showNotice(result.message, result.ok ? 'success' : 'error')
  if (result.ok) {
    router.replace({ name: 'mine', query: { tab: 'custom' } })
  }
}

async function renamePlaylist() {
  if (!playlist.value || !isCustom.value) return
  const nextName = window.prompt('请输入新的歌单名称', playlist.value.title)
  if (nextName === null || nextName.trim() === playlist.value.title) return
  const result = await userStore.updateCustomPlaylist(playlist.value.id, nextName)
  showNotice(result.message, result.ok ? 'success' : 'error')
}
</script>

<template>
  <div v-if="playlist" class="playlist-page functional-page">
    <div class="playlist-hero">
      <div class="playlist-cover">
        <img :src="playlist.cover" :alt="playlist.title" loading="lazy" decoding="async" />
      </div>
      <div class="playlist-info">
        <span class="playlist-badge">歌单</span>
        <h1 class="playlist-title">{{ playlist.title }}</h1>
        <p class="playlist-desc">{{ playlist.description }}</p>
        <p class="playlist-meta">{{ playlist.genre }} · {{ playlist.mood }} · {{ playlist.era }}</p>
        <div class="playlist-actions">
          <button type="button" class="playlist-play" @click="playAll">
            <Icon :name="isPlayingList ? 'pause' : 'play'" :size="18" />
            {{ isPlayingList ? '暂停' : '播放全部' }}
          </button>
          <button
            v-if="!isCustom"
            type="button"
            class="playlist-favorite"
            :class="{ active: isFavorite }"
            @click="toggleFavorite"
          >
            <Icon :name="isFavorite ? 'heart' : 'heart-outline'" />
            {{ isFavorite ? '已收藏' : '收藏歌单' }}
          </button>
          <template v-else>
            <button type="button" class="playlist-edit" @click="renamePlaylist">
              编辑名称
            </button>
            <button type="button" class="playlist-delete" @click="deletePlaylist">
              <Icon name="close" />
              删除歌单
            </button>
          </template>
        </div>
      </div>
    </div>

    <section class="playlist-section">
      <h2 class="playlist-section-title">歌曲列表 · {{ songs.length }} 首</h2>

      <div v-if="songs.length" class="functional-list">
        <div
          v-for="song in songs"
          :key="song.id"
          class="functional-row playlist-row has-add-action"
          :class="{ playing: currentSong?.id === song.id, 'has-remove-action': isCustom }"
        >
          <button type="button" class="row-play" @click="playSong(song)">
            <Icon :name="currentSong?.id === song.id && playerStore.isPlaying ? 'pause' : 'play'" />
          </button>
          <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
          <strong>{{ song.title }} - {{ song.artist }}</strong>
          <span>{{ song.album }}</span>
          <span>{{ song.duration }}</span>
          <div class="song-action-group">
            <FavoriteSongButton :song="song" />
            <AddToPlaylistButton :song="song" />
          </div>
          <button
            v-if="isCustom"
            type="button"
            class="playlist-remove"
            title="从歌单移除"
            aria-label="从歌单移除"
            @click="removeSong(song.id)"
          >
            <Icon name="close" :size="18" />
          </button>
        </div>
      </div>
      <div v-else class="functional-empty">该歌单暂时没有歌曲</div>
    </section>
  </div>

  <div v-else class="functional-page">
    <div class="functional-empty">歌单不存在或已被删除</div>
  </div>
</template>

<style scoped>
.playlist-hero {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 34px;
}

.playlist-cover {
  flex: 0 0 auto;
  width: 220px;
  height: 220px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(93, 54, 70, 0.22);
}

.playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-info {
  min-width: 0;
}

.playlist-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 105, 157, 0.14);
  color: var(--brand-strong);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}

.playlist-title {
  margin: 12px 0;
  font-size: 34px;
  letter-spacing: 1px;
  font-weight: 900;
}

.playlist-desc {
  margin: 0 0 8px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
}

.playlist-meta {
  margin: 0 0 20px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

.playlist-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.playlist-play,
.playlist-favorite,
.playlist-edit,
.playlist-delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 22px;
  border-radius: 999px;
  font-weight: 800;
}

.playlist-play {
  min-width: 132px;
  justify-content: center;
  background: var(--brand);
  color: #fff;
}

.playlist-play:hover {
  background: var(--brand-hover);
}

.playlist-favorite {
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary);
  min-width: 132px;
  justify-content: center;
  font-variant-emoji: text;
}

.playlist-favorite.active {
  background: rgba(255, 105, 157, 0.16);
  color: var(--brand-strong);
}

.playlist-delete {
  min-width: 132px;
  justify-content: center;
  background: rgba(197, 53, 78, 0.1);
  color: #c5354e;
}

.playlist-edit {
  min-width: 108px;
  justify-content: center;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary);
}

.playlist-edit:hover {
  background: rgba(255, 105, 157, 0.12);
  color: var(--brand-strong);
}

.playlist-delete:hover {
  background: rgba(197, 53, 78, 0.18);
}

.playlist-row.has-remove-action {
  grid-template-columns: 42px 56px minmax(0, 1fr) 110px 90px 90px 40px;
}

.playlist-remove {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  color: var(--brand-strong);
}

.playlist-remove:hover {
  background: rgba(255, 105, 157, 0.14);
}

@media (max-width: 960px) {
  .playlist-row.has-remove-action {
    grid-template-columns: 42px 52px minmax(0, 1fr) 90px 90px 40px;
  }
}

.playlist-section-title {
  margin: 0 0 18px;
  font-size: 20px;
  letter-spacing: 1px;
}

.playlist-row.playing {
  border-color: rgba(255, 105, 157, 0.5);
  background: rgba(255, 192, 203, 0.28);
}

@media (max-width: 700px) {
  .playlist-row.has-remove-action {
    grid-template-columns: 36px 48px minmax(0, 1fr) 80px 36px;
  }

  .playlist-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .playlist-cover {
    width: 160px;
    height: 160px;
  }

  .playlist-title {
    font-size: 26px;
  }
}
</style>
