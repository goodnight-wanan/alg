<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAlbumById } from '../data/catalogData'
import { usePlayerStore } from '../stores/player'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const album = computed(() => getAlbumById(route.params.id))
const songs = computed(() => album.value?.songs || [])
const currentSong = computed(() => playerStore.currentSong)

const isPlayingList = computed(() => playerStore.isListActive(songs.value) && playerStore.isPlaying)

const releaseYear = computed(() => {
  const date = album.value?.releaseDate
  if (!date) return ''
  const year = new Date(date).getFullYear()
  return Number.isFinite(year) ? String(year) : ''
})

function playAll() {
  if (!songs.value.length) return
  playerStore.playAll(songs.value)
}

function playSong(song) {
  playerStore.playSong(song, songs.value)
}

function goBack() {
  router.push({ name: 'album' })
}
</script>

<template>
  <div v-if="album" class="album-detail-page functional-page">
    <button type="button" class="album-detail-back" @click="goBack">← 返回新碟列表</button>

    <div class="album-detail-hero">
      <div class="album-detail-cover">
        <img :src="album.cover" :alt="album.title" loading="lazy" decoding="async" />
      </div>
      <div class="album-detail-info">
        <span class="album-detail-badge">专辑</span>
        <h1 class="album-detail-title">{{ album.title }}</h1>
        <p class="album-detail-desc">{{ album.description || '悦音精选专辑。' }}</p>
        <p class="album-detail-meta">
          {{ album.artist }} · {{ releaseYear || '年代未知' }} · {{ songs.length }} 首
        </p>
        <div class="album-detail-actions">
          <button type="button" class="album-detail-play" @click="playAll">
            <Icon :name="isPlayingList ? 'pause' : 'play'" :size="18" />
            {{ isPlayingList ? '暂停' : '播放全部' }}
          </button>
        </div>
      </div>
    </div>

    <section class="album-detail-section">
      <h2 class="album-detail-section-title">歌曲列表 · {{ songs.length }} 首</h2>

      <div v-if="songs.length" class="functional-list">
        <div
          v-for="song in songs"
          :key="song.id"
          class="functional-row has-add-action"
          :class="{ playing: currentSong?.id === song.id }"
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
        </div>
      </div>
      <div v-else class="functional-empty">该专辑暂时没有歌曲</div>
    </section>
  </div>

  <div v-else class="functional-page">
    <div class="functional-empty">专辑不存在或已被删除</div>
  </div>
</template>

<style scoped>
.album-detail-back {
  margin-bottom: 18px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
}

.album-detail-back:hover {
  color: var(--brand-strong);
}

.album-detail-hero {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 34px;
}

.album-detail-cover {
  flex: 0 0 auto;
  width: 220px;
  height: 220px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(93, 54, 70, 0.22);
}

.album-detail-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-detail-info {
  min-width: 0;
}

.album-detail-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 105, 157, 0.14);
  color: var(--brand-strong);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}

.album-detail-title {
  margin: 12px 0;
  font-size: 34px;
  letter-spacing: 1px;
  font-weight: 900;
}

.album-detail-desc {
  margin: 0 0 8px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
}

.album-detail-meta {
  margin: 0 0 20px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

.album-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.album-detail-play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 132px;
  padding: 11px 22px;
  border-radius: 999px;
  background: var(--brand);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.album-detail-play:hover {
  background: var(--brand-hover);
}

.album-detail-section-title {
  margin: 0 0 18px;
  font-size: 20px;
  letter-spacing: 1px;
}

@media (max-width: 700px) {
  .album-detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .album-detail-cover {
    width: 160px;
    height: 160px;
  }

  .album-detail-title {
    font-size: 26px;
  }
}
</style>
