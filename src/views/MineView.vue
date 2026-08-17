<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getPlaylistById, getSongById } from '../data/musicData'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'

const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()
const activeTab = ref('favorite')

const favoriteSongs = computed(() =>
  userStore.favoriteSongs.map(getSongById).filter(Boolean)
)
const historySongs = computed(() =>
  userStore.playHistory.map(getSongById).filter(Boolean)
)
const favoritePlaylists = computed(() =>
  userStore.favoritePlaylists.map(getPlaylistById).filter(Boolean)
)

function playSong(song, list) {
  userStore.recordPlay(song.id)
  playerStore.playSong(song, list)
}

function openPlaylist(id) {
  router.push({ name: 'playlist', params: { id } })
}
</script>

<template>
  <div class="functional-page">
    <h1 class="functional-title">我的音乐</h1>
    <p class="mine-user">{{ userStore.currentUser.username }} · {{ userStore.currentUser.email }}</p>
    <button class="logout-button" type="button" @click="userStore.logout">退出登录</button>

    <div class="functional-tabs">
      <button type="button" :class="{ active: activeTab === 'favorite' }" @click="activeTab = 'favorite'">
        收藏歌曲
      </button>
      <button type="button" :class="{ active: activeTab === 'playlist' }" @click="activeTab = 'playlist'">
        收藏歌单
      </button>
      <button type="button" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
        最近播放
      </button>
    </div>

    <template v-if="activeTab === 'favorite'">
      <div v-if="favoriteSongs.length" class="functional-list">
        <div v-for="(song, index) in favoriteSongs" :key="song.id" class="functional-row">
          <button type="button" class="row-play" @click="playSong(song, favoriteSongs)">▶</button>
          <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
          <strong>{{ song.title }} - {{ song.artist }}</strong>
          <span>{{ song.album }}</span>
          <span>{{ song.duration }}</span>
        </div>
      </div>
      <div v-else class="functional-empty">还没有收藏歌曲</div>
    </template>

    <template v-else-if="activeTab === 'playlist'">
      <div v-if="favoritePlaylists.length" class="functional-grid">
        <div
          v-for="playlist in favoritePlaylists"
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
      <div v-else class="functional-empty">还没有收藏歌单</div>
    </template>

    <template v-else>
      <div v-if="historySongs.length" class="functional-list">
        <div v-for="(song, index) in historySongs" :key="song.id" class="functional-row">
          <button type="button" class="row-play" @click="playSong(song, historySongs)">▶</button>
          <img :src="song.cover" :alt="song.title" />
          <strong>{{ song.title }} - {{ song.artist }}</strong>
          <span>{{ song.album }}</span>
          <span>{{ song.duration }}</span>
        </div>
      </div>
      <div v-else class="functional-empty">还没有播放记录</div>
    </template>
  </div>
</template>
