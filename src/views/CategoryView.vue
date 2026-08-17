<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlaylistCard from '../components/PlaylistCard.vue'
import { categories, getPlaylistSongs, playlists } from '../data/musicData'

const route = useRoute()
const router = useRouter()
const keyword = ref('')

const filters = [
  { key: 'genre', label: '类型', options: categories.genres },
  { key: 'mood', label: '心情', options: categories.moods },
  { key: 'era', label: '年代', options: categories.eras },
  { key: 'region', label: '地区', options: categories.regions }
]

const activeFilters = computed(() => ({
  genre: route.query.genre || '',
  mood: route.query.mood || '',
  era: route.query.era || '',
  region: route.query.region || ''
}))

const filteredPlaylists = computed(() => {
  const word = keyword.value.trim().toLowerCase()

  return playlists.filter((playlist) => {
    const songs = getPlaylistSongs(playlist)
    const regions = new Set(songs.map((song) => song.region).filter(Boolean))

    const matchGenre = !activeFilters.value.genre || playlist.genre === activeFilters.value.genre
    const matchMood = !activeFilters.value.mood || playlist.mood === activeFilters.value.mood
    const matchEra = !activeFilters.value.era || playlist.era === activeFilters.value.era
    const matchRegion = !activeFilters.value.region || regions.has(activeFilters.value.region)
    const matchKeyword =
      !word ||
      playlist.title.toLowerCase().includes(word) ||
      playlist.description.toLowerCase().includes(word)

    return matchGenre && matchMood && matchEra && matchRegion && matchKeyword
  })
})

const hasActiveFilter = computed(() =>
  Object.values(activeFilters.value).some(Boolean) || Boolean(keyword.value.trim())
)

function toggleFilter(key, value) {
  const query = { ...route.query }
  if (query[key] === value) {
    delete query[key]
  } else {
    query[key] = value
  }
  router.replace({ query })
}

function resetFilters() {
  keyword.value = ''
  router.replace({ query: {} })
}
</script>

<template>
  <div class="category-view">
    <div class="page-heading">
      <p class="eyebrow">DISCOVER PLAYLISTS</p>
      <h1>分类歌单</h1>
      <p>按类型、心情、年代和地区，找到此刻想听的歌单。</p>
    </div>

    <section class="filter-panel">
      <div class="filter-search">
        <input v-model="keyword" type="search" placeholder="搜索歌单名称或描述" />
      </div>

      <div v-for="filter in filters" :key="filter.key" class="filter-row">
        <span class="filter-label">{{ filter.label }}</span>
        <div class="filter-options">
          <button
            v-for="option in filter.options"
            :key="option"
            type="button"
            :class="{ active: activeFilters[filter.key] === option }"
            @click="toggleFilter(filter.key, option)"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <div class="filter-footer">
        <span>找到 {{ filteredPlaylists.length }} 个歌单</span>
        <button v-if="hasActiveFilter" type="button" class="reset-button" @click="resetFilters">
          清除筛选
        </button>
      </div>
    </section>

    <div v-if="filteredPlaylists.length" class="grid playlist-grid">
      <PlaylistCard
        v-for="playlist in filteredPlaylists"
        :key="playlist.id"
        :playlist="playlist"
      />
    </div>

    <div v-else class="empty-state">
      <div>
        <strong>没有找到符合条件的歌单</strong>
        <p>试试减少筛选条件，或者换一个关键词。</p>
        <button class="btn btn-primary" type="button" @click="resetFilters">清除筛选</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-heading {
  margin-bottom: 26px;
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

.filter-panel {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-soft);
}

.filter-search input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface-soft);
}

.filter-row {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}

.filter-label {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-options button {
  min-height: 32px;
  padding: 0 13px;
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--muted);
  font-size: 13px;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.filter-options button:hover,
.filter-options button.active {
  background: var(--primary);
  color: #fff;
}

.filter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  color: var(--muted);
  font-size: 13px;
}

.reset-button {
  padding: 8px 14px;
  border-radius: 999px;
  background: transparent;
  color: var(--primary);
  font-weight: 700;
}

.playlist-grid {
  margin-top: 24px;
}

@media (max-width: 640px) {
  .filter-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
