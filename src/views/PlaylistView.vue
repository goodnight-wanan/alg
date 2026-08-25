<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getPlaylistById, getPlaylistSongs } from '../data/musicData'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { showNotice } from '../utils/notice'

const route = useRoute()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const playlist = computed(() => getPlaylistById(route.params.id))
const songs = computed(() => getPlaylistSongs(playlist.value))
const currentSong = computed(() => playerStore.currentSong)

const isFavorite = computed(() =>
  playlist.value ? userStore.isFavoritePlaylist(playlist.value.id) : false
)

const isPlayingList = computed(() =>
  playerStore.isListActive(songs.value) && playerStore.isPlaying
)

function playAll() {
  if (!songs.value.length) return
  playerStore.playSong(songs.value[0], songs.value)
}

function playSong(song) {
  playerStore.playSong(song, songs.value)
}

function toggleFavorite() {
  if (!playlist.value) return

  if (!userStore.isLoggedIn) {
    showNotice('请先登录后再收藏歌单')
    return
  }

  userStore.toggleFavoritePlaylist(playlist.value.id)
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
            <Icon :name="isPlayingList ? 'pause' : 'play'" />
            {{ isPlayingList ? '暂停' : '播放全部' }}
          </button>
          <button
            type="button"
            class="playlist-favorite"
            :class="{ active: isFavorite }"
            @click="toggleFavorite"
          >
            <Icon :name="isFavorite ? 'heart' : 'heart-outline'" /> {{ isFavorite ? '已收藏' : '收藏歌单' }}
          </button>
        </div>
      </div>
    </div>

    <section class="playlist-section">
      <h2 class="playlist-section-title">歌曲列表 · {{ songs.length }} 首</h2>

      <div v-if="songs.length" class="functional-list">
        <div
          v-for="song in songs"
          :key="song.id"
          class="functional-row playlist-row"
          :class="{ playing: currentSong?.id === song.id }"
        >
          <button type="button" class="row-play" @click="playSong(song)">
            <Icon :name="currentSong?.id === song.id && playerStore.isPlaying ? 'pause' : 'play'" />
          </button>
          <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
          <strong>{{ song.title }} - {{ song.artist }}</strong>
          <span>{{ song.album }}</span>
          <span>{{ song.duration }}</span>
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
  color: #e94e77;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}

.playlist-title {
  margin: 12px 0;
  font-size: 34px;
  letter-spacing: 1px;
  font-weight: 1000;
}

.playlist-desc {
  margin: 0 0 8px;
  color: #665d63;
  font-size: 15px;
  line-height: 1.7;
}

.playlist-meta {
  margin: 0 0 20px;
  color: #8a7d83;
  font-size: 13px;
  font-weight: 700;
}

.playlist-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.playlist-play,
.playlist-favorite {
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
  background: #ff7eb3;
  color: #fff;
}

.playlist-play:hover {
  background: #f76a9f;
}

.playlist-favorite {
  background: rgba(25, 25, 25, 0.06);
  color: #665d63;
  min-width: 132px;
  justify-content: center;
  font-variant-emoji: text;
}

.playlist-favorite.active {
  background: rgba(255, 105, 157, 0.16);
  color: #e94e77;
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
