<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { categories, getPlaylistSongs, playlists } from '../data/musicData'
import { usePlayerStore } from '../stores/player'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const keyword = ref(String(route.query.q || ''))
const filters = reactive({
  genre: String(route.query.genre || ''),
  mood: String(route.query.mood || ''),
  era: String(route.query.era || ''),
  region: String(route.query.region || '')
})

const filterGroups = [
  { key: 'genre', label: '类型', options: categories.genres },
  { key: 'mood', label: '心情', options: categories.moods },
  { key: 'era', label: '年代', options: categories.eras },
  { key: 'region', label: '地区', options: categories.regions }
]

let keywordTimer = null

function syncQuery() {
  const query = {}
  const word = keyword.value.trim()
  if (word) query.q = word
  if (filters.genre) query.genre = filters.genre
  if (filters.mood) query.mood = filters.mood
  if (filters.era) query.era = filters.era
  if (filters.region) query.region = filters.region
  router.replace({ name: 'category', query })
}

watch(keyword, () => {
  window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(syncQuery, 400)
})

watch(filters, syncQuery)

watch(
  () => [route.query.q, route.query.genre, route.query.mood, route.query.era, route.query.region].join('|'),
  () => {
    keyword.value = String(route.query.q || '')
    filters.genre = String(route.query.genre || '')
    filters.mood = String(route.query.mood || '')
    filters.era = String(route.query.era || '')
    filters.region = String(route.query.region || '')
  }
)

const filteredPlaylists = computed(() => {
  const word = keyword.value.trim().toLowerCase()

  return playlists.filter((playlist) => {
    const songs = getPlaylistSongs(playlist)
    const regions = new Set(songs.map((song) => song.region).filter(Boolean))

    const matchGenre = !filters.genre || playlist.genre === filters.genre
    const matchMood = !filters.mood || playlist.mood === filters.mood
    const matchEra = !filters.era || playlist.era === filters.era
    const matchRegion = !filters.region || regions.has(filters.region)
    const matchKeyword =
      !word ||
      playlist.title.toLowerCase().includes(word) ||
      playlist.description.toLowerCase().includes(word)

    return matchGenre && matchMood && matchEra && matchRegion && matchKeyword
  })
})

const activeFilterCount = computed(() =>
  [filters.genre, filters.mood, filters.era, filters.region].filter(Boolean).length
)

function setFilter(key, value) {
  filters[key] = filters[key] === value ? '' : value
}

function clearFilter(key) {
  filters[key] = ''
}

function clearFilters() {
  filters.genre = ''
  filters.mood = ''
  filters.era = ''
  filters.region = ''
}

function resetAll() {
  clearFilters()
  keyword.value = ''
}

function openPlaylist(id) {
  router.push({ name: 'playlist', params: { id } })
}

function playPlaylist(playlist) {
  const list = getPlaylistSongs(playlist)
  if (list.length) {
    playerStore.playSong(list[0], list)
  }
}
</script>

<template>
  <div class="functional-page category-page">
    <div class="category-head">
      <h1 class="functional-title category-title">歌单分类</h1>
      <input
        v-model="keyword"
        class="search-input"
        type="search"
        placeholder="搜索歌单名称或描述"
      />
    </div>

    <section class="filter-panel" aria-label="筛选条件">
      <div v-for="group in filterGroups" :key="group.key" class="filter-group">
        <span class="filter-label">{{ group.label }}</span>
        <div class="filter-options">
          <button
            type="button"
            class="filter-chip"
            :class="{ active: !filters[group.key] }"
            :aria-pressed="!filters[group.key]"
            @click="clearFilter(group.key)"
          >全部</button>
          <button
            v-for="option in group.options"
            :key="option"
            type="button"
            class="filter-chip"
            :class="{ active: filters[group.key] === option }"
            :aria-pressed="filters[group.key] === option"
            @click="setFilter(group.key, option)"
          >{{ option }}</button>
        </div>
      </div>

      <div class="filter-footer">
        <span class="result-count">共 {{ filteredPlaylists.length }} 个歌单</span>
        <button
          type="button"
          class="clear-filter"
          :disabled="!activeFilterCount"
          @click="clearFilters"
        >清除筛选</button>
      </div>
    </section>

    <div v-if="filteredPlaylists.length" class="category-grid">
      <article v-for="playlist in filteredPlaylists" :key="playlist.id" class="category-card">
        <div class="category-cover" @click="openPlaylist(playlist.id)">
          <img :src="playlist.cover" :alt="playlist.title" loading="lazy" decoding="async" />
          <button
            type="button"
            class="category-play"
            title="播放"
            @click.stop="playPlaylist(playlist)"
          >▶</button>
        </div>
        <h3 class="category-card-title" @click="openPlaylist(playlist.id)">{{ playlist.title }}</h3>
        <p class="category-card-meta">{{ playlist.genre }} · {{ playlist.mood }}</p>
      </article>
    </div>

    <div v-else class="category-empty">
      <div class="category-empty-icon">♪</div>
      <p>没有找到符合条件的歌单</p>
      <button type="button" class="clear-filter" @click="resetAll">清除筛选</button>
    </div>
  </div>
</template>

<style scoped>
.category-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.category-title {
  margin: 0;
}

.category-head .search-input {
  flex: 0 1 360px;
  max-width: 360px;
}

.filter-panel {
  padding: 20px 22px;
  margin-bottom: 28px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
}

.filter-group {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 0;
}

.filter-group + .filter-group {
  border-top: 1px solid rgba(25, 25, 25, 0.06);
}

.filter-label {
  flex: 0 0 auto;
  width: 56px;
  padding-top: 7px;
  color: #e94e77;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: #665d63;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.filter-chip:hover {
  color: #e94e77;
  border-color: rgba(255, 105, 157, 0.3);
}

.filter-chip.active {
  background: #ff7eb3;
  color: #fff;
  border-color: #ff7eb3;
}

.filter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px solid rgba(25, 25, 25, 0.06);
}

.result-count {
  color: #665d63;
  font-size: 13px;
  font-weight: 700;
}

.clear-filter {
  padding: 7px 16px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: #665d63;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.18s ease;
}

.clear-filter:hover {
  color: #e94e77;
}

.clear-filter:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 22px 18px;
}

.category-card {
  min-width: 0;
}

.category-cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(93, 54, 70, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.category-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.category-card:hover .category-cover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(93, 54, 70, 0.16);
}

.category-card:hover .category-cover img {
  transform: scale(1.06);
}

.category-play {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #e94e77;
  font-size: 18px;
  box-shadow: 0 6px 14px rgba(93, 54, 70, 0.2);
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
  cursor: pointer;
}

.category-card:hover .category-play {
  opacity: 1;
  transform: translateY(0);
}

.category-play:hover {
  background: #ff7eb3;
  color: #fff;
}

.category-card-title {
  margin: 10px 0 4px;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.4;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.category-card-title:hover {
  color: #e94e77;
}

.category-card-meta {
  margin: 0;
  color: #8a7d83;
  font-size: 12px;
  font-weight: 600;
}

.category-empty {
  display: grid;
  place-items: center;
  padding: 60px 20px;
  border: 1px dashed rgba(25, 25, 25, 0.2);
  border-radius: 12px;
  text-align: center;
  color: #665d63;
}

.category-empty-icon {
  font-size: 48px;
  color: #e94e77;
}

.category-empty p {
  margin: 8px 0 16px;
}

@media (max-width: 700px) {
  .category-head {
    align-items: stretch;
  }

  .category-head .search-input {
    flex: 1 1 100%;
    max-width: none;
  }

  .filter-group {
    flex-direction: column;
    gap: 8px;
  }

  .filter-label {
    width: auto;
  }
}
</style>