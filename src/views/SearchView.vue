<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArtists, playlists, songs } from '../data/musicData'
import { usePlayerStore } from '../stores/player'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const currentSong = computed(() => playerStore.currentSong)

const keyword = ref(String(route.query.q || ''))
const TAB_NAMES = ['song', 'playlist', 'artist']

function normalizeTab(value) {
  return TAB_NAMES.includes(value) ? value : 'song'
}

const activeTab = ref(normalizeTab(route.query.tab))

let keywordTimer = null

watch(
  () => route.query.q,
  (value) => {
    keyword.value = String(value || '')
  }
)

watch(
  () => route.query.tab,
  (value) => {
    activeTab.value = normalizeTab(value)
  }
)

watch(keyword, () => {
  window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(() => {
    const query = { ...route.query }
    const value = keyword.value.trim()
    if (value) {
      query.q = value
    } else {
      delete query.q
    }
    router.replace({ name: 'search', query })
  }, 400)
})

watch(activeTab, (value) => {
  const query = { ...route.query }
  if (value === 'song') {
    delete query.tab
  } else {
    query.tab = value
  }
  router.replace({ name: 'search', query })
})

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())

const songResults = computed(() => {
  if (!normalizedKeyword.value) return []
  return songs.filter((song) =>
    [song.title, song.artist, song.album, song.genre, song.mood]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword.value)
  )
})

const playlistResults = computed(() => {
  if (!normalizedKeyword.value) return []
  return playlists.filter((playlist) =>
    [playlist.title, playlist.description, playlist.genre, playlist.mood, playlist.era]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword.value)
  )
})

const artistResults = computed(() => {
  if (!normalizedKeyword.value) return []
  return getArtists().filter((artist) =>
    [artist.name, artist.genre, artist.region]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword.value)
  )
})

function playSong(song, list) {
  playerStore.playSong(song, list)
}

function openPlaylist(id) {
  router.push({ name: 'playlist', params: { id } })
}

function openArtist(artist) {
  router.push({ name: 'artist', query: { q: artist.name } })
}
</script>

<template>
  <div class="functional-page">
    <h1 class="functional-title">搜索</h1>
    <input
      v-model="keyword"
      class="search-input"
      type="search"
      placeholder="搜索歌曲、歌单、歌手"
    />

    <div class="functional-tabs">
      <button type="button" :class="{ active: activeTab === 'song' }" @click="activeTab = 'song'">
        歌曲 {{ songResults.length }}
      </button>
      <button type="button" :class="{ active: activeTab === 'playlist' }" @click="activeTab = 'playlist'">
        歌单 {{ playlistResults.length }}
      </button>
      <button type="button" :class="{ active: activeTab === 'artist' }" @click="activeTab = 'artist'">
        歌手 {{ artistResults.length }}
      </button>
    </div>

    <template v-if="activeTab === 'song'">
      <div v-if="songResults.length" class="functional-list">
        <div
          v-for="(song, index) in songResults"
          :key="song.id"
          class="functional-row"
          :class="{ playing: currentSong?.id === song.id }"
        >
          <button type="button" class="row-play" @click="playSong(song, songResults)">
            <Icon :name="currentSong?.id === song.id && playerStore.isPlaying ? 'pause' : 'play'" />
          </button>
          <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
          <strong>{{ song.title }} - {{ song.artist }}</strong>
          <span>{{ song.album }}</span>
          <span>{{ song.duration }}</span>
        </div>
      </div>
      <div v-else class="functional-empty">没有找到相关歌曲</div>
    </template>

    <template v-else-if="activeTab === 'playlist'">
      <div v-if="playlistResults.length" class="functional-grid">
        <div
          v-for="playlist in playlistResults"
          :key="playlist.id"
          class="functional-card"
          role="button"
          tabindex="0"
          :aria-label="`打开歌单 ${playlist.title}`"
          @click="openPlaylist(playlist.id)"
          @keydown.enter.space.prevent="openPlaylist(playlist.id)"
        >
          <div class="functional-cover">
            <img :src="playlist.cover" :alt="playlist.title" loading="lazy" decoding="async" />
          </div>
          <p class="functional-card-title">{{ playlist.title }}</p>
        </div>
      </div>
      <div v-else class="functional-empty">没有找到相关歌单</div>
    </template>

    <template v-else>
      <div v-if="artistResults.length" class="artist-results">
        <button
          v-for="artist in artistResults"
          :key="artist.name"
          type="button"
          class="artist-result-card"
          @click="openArtist(artist)"
        >
          <span class="artist-result-avatar">
            <img :src="artist.cover" :alt="artist.name" loading="lazy" decoding="async" />
          </span>
          <span class="artist-result-name">{{ artist.name }}</span>
          <span class="artist-result-meta">{{ artist.region }} · {{ artist.songCount }} 首歌</span>
        </button>
      </div>
      <div v-else class="functional-empty">没有找到相关歌手</div>
    </template>
  </div>
</template>

<style scoped>
.artist-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 18px 14px;
}

.artist-result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  color: #191516;
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.artist-result-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 26px rgba(93, 54, 70, 0.12);
  border-color: #ff7eb3;
}

.artist-result-avatar {
  display: block;
  width: 88px;
  height: 88px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  background: rgba(255, 192, 203, 0.3);
  box-shadow: 0 8px 18px rgba(93, 54, 70, 0.16);
}

.artist-result-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-result-name {
  display: block;
  width: 100%;
  overflow: hidden;
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-result-meta {
  display: block;
  color: #8a7d83;
  font-size: 12px;
  font-weight: 600;
}
</style>
