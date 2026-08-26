<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { categories, getArtists } from '../data/musicData'
import { usePlayerStore } from '../stores/player'

const playerStore = usePlayerStore()
const route = useRoute()

const artists = computed(() =>
  [...getArtists()].sort((a, b) => b.songCount - a.songCount || a.name.localeCompare(b.name))
)

const keyword = ref(String(route.query.q || ''))
const activeRegion = ref('')
const selectedArtist = ref(null)
const detailEl = ref(null)

watch(
  () => route.query.q,
  (value) => {
    keyword.value = String(value || '')
  }
)

const regionOptions = categories.regions
const currentSong = computed(() => playerStore.currentSong)

const filteredArtists = computed(() => {
  const word = keyword.value.trim().toLowerCase()

  return artists.value.filter((artist) => {
    const matchRegion = !activeRegion.value || artist.region === activeRegion.value
    const matchKeyword =
      !word ||
      artist.name.toLowerCase().includes(word) ||
      artist.genre.toLowerCase().includes(word) ||
      artist.region.toLowerCase().includes(word)

    return matchRegion && matchKeyword
  })
})

const isPlayingList = computed(() => {
  const list = selectedArtist.value?.songs || []
  return list.length > 0 && playerStore.isListActive(list) && playerStore.isPlaying
})

function selectArtist(artist) {
  selectedArtist.value = artist
  nextTick(() => {
    detailEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function closeDetail() {
  selectedArtist.value = null
}

function playAll() {
  const list = selectedArtist.value?.songs || []
  if (!list.length) return
  playerStore.playAll(list)
}

function playSong(song) {
  const list = selectedArtist.value?.songs || []
  playerStore.playSong(song, list)
}
</script>

<template>
  <div class="functional-page artist-page">
    <div class="artist-head">
      <h1 class="functional-title">歌手</h1>
      <input
        v-model="keyword"
        class="search-input"
        type="search"
        placeholder="搜索歌手名称、风格或地区"
        aria-label="搜索歌手"
      />
    </div>

    <div class="artist-region" aria-label="地区筛选">
      <button
        type="button"
        class="filter-chip"
        :class="{ active: !activeRegion }"
        :aria-pressed="!activeRegion"
        @click="activeRegion = ''"
      >全部</button>
      <button
        v-for="region in regionOptions"
        :key="region"
        type="button"
        class="filter-chip"
        :class="{ active: activeRegion === region }"
        :aria-pressed="activeRegion === region"
        @click="activeRegion = region"
      >{{ region }}</button>
      <span class="artist-count">共 {{ filteredArtists.length }} 位歌手</span>
    </div>

    <div v-if="filteredArtists.length" class="artist-grid">
      <button
        v-for="artist in filteredArtists"
        :key="artist.name"
        type="button"
        class="artist-card"
        :class="{ active: selectedArtist?.name === artist.name }"
        @click="selectArtist(artist)"
      >
        <span class="artist-avatar">
          <img :src="artist.cover" :alt="artist.name" loading="lazy" decoding="async" />
        </span>
        <span class="artist-name">{{ artist.name }}</span>
        <span class="artist-meta">{{ artist.region }} · {{ artist.songCount }} 首歌</span>
      </button>
    </div>
    <div v-else class="functional-empty">没有找到相关歌手</div>

    <section v-if="selectedArtist" ref="detailEl" class="artist-detail">
      <button type="button" class="artist-back" @click="closeDetail">← 返回歌手列表</button>

      <div class="artist-detail-hero">
        <span class="artist-avatar-large">
          <img :src="selectedArtist.cover" :alt="selectedArtist.name" loading="lazy" decoding="async" />
        </span>
        <div class="artist-detail-info">
          <span class="artist-badge">歌手</span>
          <h2 class="artist-detail-name">{{ selectedArtist.name }}</h2>
          <p class="artist-detail-meta">{{ selectedArtist.region }} · {{ selectedArtist.genre }}</p>
          <div class="artist-detail-actions">
            <button type="button" class="artist-play" @click="playAll">
              <Icon :name="isPlayingList ? 'pause' : 'play'" :size="18" />
              {{ isPlayingList ? '暂停' : '播放全部' }}
            </button>
          </div>
        </div>
      </div>

      <h3 class="artist-songs-title">代表歌曲 · {{ selectedArtist.songCount }} 首</h3>
      <div class="functional-list">
        <div
          v-for="song in selectedArtist.songs"
          :key="song.id"
          class="functional-row"
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
    </section>
  </div>
</template>

<style scoped>
.artist-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.artist-head .functional-title {
  margin: 0;
}

.artist-head .search-input {
  flex: 0 1 340px;
  max-width: 340px;
}

.artist-region {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 26px;
}

.artist-count {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.filter-chip {
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.filter-chip:hover {
  color: var(--brand-strong);
  border-color: rgba(255, 105, 157, 0.3);
}

.filter-chip.active {
  background: var(--brand);
  color: #fff;
  border-color: var(--brand);
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 22px 14px;
}

.artist-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.artist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 26px rgba(93, 54, 70, 0.12);
}

.artist-card.active {
  border-color: var(--brand);
}

.artist-avatar {
  display: block;
  width: 88px;
  height: 88px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  background: rgba(255, 192, 203, 0.3);
  box-shadow: 0 8px 18px rgba(93, 54, 70, 0.16);
}

.artist-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-name {
  display: block;
  width: 100%;
  overflow: hidden;
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-meta {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.artist-detail {
  margin-top: 40px;
  padding-top: 28px;
  border-top: 1px solid rgba(25, 25, 25, 0.08);
  scroll-margin-top: calc(var(--header-height, 0px) + 20px);
}

.artist-back {
  margin-bottom: 18px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
}

.artist-back:hover {
  color: var(--brand-strong);
}

.artist-detail-hero {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 26px;
}

.artist-avatar-large {
  flex: 0 0 auto;
  display: block;
  width: 160px;
  height: 160px;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  background: rgba(255, 192, 203, 0.3);
  box-shadow: 0 18px 40px rgba(93, 54, 70, 0.22);
}

.artist-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-detail-info {
  min-width: 0;
}

.artist-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 105, 157, 0.14);
  color: var(--brand-strong);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}

.artist-detail-name {
  margin: 12px 0 6px;
  font-size: 32px;
  letter-spacing: 1px;
  font-weight: 900;
}

.artist-detail-meta {
  margin: 0 0 20px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

.artist-detail-actions {
  display: flex;
  gap: 12px;
}

.artist-play {
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

.artist-play:hover {
  background: var(--brand-hover);
}

.artist-songs-title {
  margin: 0 0 18px;
  font-size: 20px;
  letter-spacing: 1px;
}

@media (max-width: 700px) {
  .artist-head {
    align-items: stretch;
  }

  .artist-head .search-input {
    flex: 1 1 100%;
    max-width: none;
  }

  .artist-count {
    width: 100%;
    margin-left: 0;
  }

  .artist-detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .artist-avatar-large {
    width: 120px;
    height: 120px;
  }

  .artist-detail-name {
    font-size: 26px;
  }
}
</style>
