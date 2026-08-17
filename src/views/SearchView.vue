<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PlaylistCard from '../components/PlaylistCard.vue'
import SongRow from '../components/SongRow.vue'
import { playlists, songs } from '../data/musicData'

const route = useRoute()
const keyword = ref(String(route.query.q || ''))
const activeTab = ref(route.query.tab === 'playlist' ? 'playlist' : 'song')

watch(
  () => route.query.q,
  (value) => {
    keyword.value = String(value || '')
  }
)

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
</script>

<template>
  <div class="search-view">
    <div class="page-heading">
      <p class="eyebrow">SEARCH</p>
      <h1>搜索</h1>
      <p v-if="normalizedKeyword">“{{ keyword }}” 的搜索结果</p>
      <p v-else>输入歌曲名、歌手、专辑或歌单名开始搜索。</p>
    </div>

    <div class="search-box">
      <input v-model="keyword" type="search" placeholder="搜索歌曲、歌单、歌手" />
    </div>

    <div class="tabs">
      <button
        type="button"
        :class="{ active: activeTab === 'song' }"
        @click="activeTab = 'song'"
      >
        歌曲 {{ songResults.length }}
      </button>
      <button
        type="button"
        :class="{ active: activeTab === 'playlist' }"
        @click="activeTab = 'playlist'"
      >
        歌单 {{ playlistResults.length }}
      </button>
    </div>

    <template v-if="activeTab === 'song'">
      <div v-if="songResults.length" class="song-list">
        <SongRow
          v-for="(song, index) in songResults"
          :key="song.id"
          :song="song"
          :index="index"
          :queue="songResults"
        />
      </div>
      <div v-else class="empty-state">
        <div>
          <strong>没有找到相关歌曲</strong>
          <p>换一个关键词试试。</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-if="playlistResults.length" class="grid playlist-grid">
        <PlaylistCard
          v-for="playlist in playlistResults"
          :key="playlist.id"
          :playlist="playlist"
        />
      </div>
      <div v-else class="empty-state">
        <div>
          <strong>没有找到相关歌单</strong>
          <p>换一个关键词试试。</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-heading {
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.page-heading h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px);
  letter-spacing: -0.04em;
}

.page-heading p:last-child {
  margin: 10px 0 0;
  color: var(--muted);
}

.search-box input {
  width: 100%;
  height: 52px;
  padding: 0 20px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow-soft);
  font-size: 16px;
}

.search-box input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(255, 94, 148, 0.12);
}

.tabs {
  display: flex;
  gap: 8px;
  margin: 22px 0;
  border-bottom: 1px solid var(--border);
}

.tabs button {
  padding: 10px 14px;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted);
  font-weight: 700;
}

.tabs button.active {
  border-bottom-color: var(--primary);
  color: var(--primary);
}

.song-list,
.playlist-grid {
  margin-top: 20px;
}
</style>
