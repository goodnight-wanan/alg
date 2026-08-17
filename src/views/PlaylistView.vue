<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SongRow from '../components/SongRow.vue'
import { getPlaylistById, getPlaylistSongs } from '../data/musicData'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'

const route = useRoute()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const playlist = computed(() => getPlaylistById(route.params.id))
const songs = computed(() => getPlaylistSongs(playlist.value))
const isFavorite = computed(() => userStore.isFavoritePlaylist(playlist.value?.id))

function playAll() {
  if (songs.value.length) {
    playerStore.playSong(songs.value[0], songs.value)
  }
}

function toggleFavoritePlaylist() {
  if (playlist.value) {
    userStore.toggleFavoritePlaylist(playlist.value.id)
  }
}
</script>

<template>
  <div class="playlist-view">
    <RouterLink v-if="playlist" to="/category" class="back-link">← 返回分类歌单</RouterLink>

    <template v-if="playlist">
      <section class="playlist-hero">
        <img class="playlist-cover" :src="playlist.cover" :alt="playlist.title" />
        <div class="playlist-info">
          <p class="eyebrow">PLAYLIST</p>
          <h1>{{ playlist.title }}</h1>
          <p>{{ playlist.description }}</p>
          <div class="tags">
            <span class="badge">{{ playlist.genre }}</span>
            <span class="badge">{{ playlist.mood }}</span>
            <span class="badge">{{ playlist.era }}</span>
          </div>
          <div class="actions">
            <button class="btn btn-primary" type="button" @click="playAll">▶ 播放全部</button>
            <button class="btn btn-ghost" type="button" @click="toggleFavoritePlaylist">
              {{ isFavorite ? '♥ 已收藏' : '♡ 收藏歌单' }}
            </button>
          </div>
        </div>
      </section>

      <section class="playlist-songs">
        <div class="list-head">
          <h2>歌曲列表</h2>
          <span>共 {{ songs.length }} 首</span>
        </div>
        <div class="song-list">
          <SongRow
            v-for="(song, index) in songs"
            :key="song.id"
            :song="song"
            :index="index"
            :queue="songs"
          />
        </div>
      </section>
    </template>

    <div v-else class="empty-state">
      <div>
        <strong>歌单不存在或已被删除</strong>
        <p>返回分类页看看其他歌单吧。</p>
        <RouterLink class="btn btn-primary" to="/category">浏览歌单</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  margin-bottom: 22px;
  color: var(--muted);
  font-size: 14px;
}

.back-link:hover {
  color: var(--primary);
}

.playlist-hero {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 30px;
  align-items: end;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: var(--shadow-soft);
}

.playlist-cover {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 22px;
  object-fit: cover;
  box-shadow: var(--shadow);
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.playlist-info h1 {
  margin: 0;
  font-size: clamp(28px, 5vw, 48px);
  letter-spacing: -0.04em;
}

.playlist-info > p:not(.eyebrow) {
  margin: 14px 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.playlist-songs {
  margin-top: 32px;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.list-head h2 {
  margin: 0;
  font-size: 24px;
}

.list-head span {
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 700px) {
  .playlist-hero {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .playlist-cover {
    max-width: 220px;
  }
}
</style>
