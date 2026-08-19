<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { playlists, songs } from '../data/musicData'
import { usePlayerStore } from '../stores/player'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const keyword = ref(String(route.query.q || ''))
const activeTab = ref(route.query.tab === 'playlist' ? 'playlist' : 'song')

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
    activeTab.value = value === 'playlist' ? 'playlist' : 'song'
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
  if (value === 'playlist') {
    query.tab = 'playlist'
  } else {
    delete query.tab
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

function playSong(song, list) {
  playerStore.playSong(song, list)
}

function openPlaylist(id) {
  router.push({ name: 'playlist', params: { id } })
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
    </div>

    <template v-if="activeTab === 'song'">
      <div v-if="songResults.length" class="functional-list">
        <div v-for="(song, index) in songResults" :key="song.id" class="functional-row">
          <button type="button" class="row-play" @click="playSong(song, songResults)">▶</button>
          <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
          <strong>{{ song.title }} - {{ song.artist }}</strong>
          <span>{{ song.album }}</span>
          <span>{{ song.duration }}</span>
        </div>
      </div>
      <div v-else class="functional-empty">没有找到相关歌曲</div>
    </template>

    <template v-else>
      <div v-if="playlistResults.length" class="functional-grid">
        <div
          v-for="playlist in playlistResults"
          :key="playlist.id"
          class="functional-card"
          @click="openPlaylist(playlist.id)"
        >
          <div class="functional-cover">
            <img :src="playlist.cover" :alt="playlist.title" loading="lazy" decoding="async" />
          </div>
          <p class="functional-card-title">{{ playlist.title }}</p>
        </div>
      </div>
      <div v-else class="functional-empty">没有找到相关歌单</div>
    </template>
  </div>
</template>
