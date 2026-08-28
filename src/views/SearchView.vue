<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArtists, getPlaylistSongs, playlists, songs } from '../data/catalogData'
import { usePlayerStore } from '../stores/player'
import { addSearchHistory, clearSearchHistory, useSearchHistory } from '../utils/searchHistory'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const currentSong = computed(() => playerStore.currentSong)

const allArtists = getArtists()
const keyword = ref(String(route.query.q || ''))
const searchInput = ref(null)
const searchHistory = useSearchHistory()
const TAB_NAMES = ['song', 'playlist', 'artist']

function normalizeTab(value) {
  return TAB_NAMES.includes(value) ? value : 'song'
}

const activeTab = ref(normalizeTab(route.query.tab))
const hasKeyword = computed(() => Boolean(keyword.value.trim()))

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

function sortByRelevance(items, getText) {
  const word = normalizedKeyword.value
  if (!word) return items
  return [...items].sort((a, b) => {
    const aStarts = getText(a).toLowerCase().startsWith(word)
    const bStarts = getText(b).toLowerCase().startsWith(word)
    if (aStarts !== bStarts) return aStarts ? -1 : 1
    return 0
  })
}

const songResults = computed(() => {
  if (!normalizedKeyword.value) return []
  const matched = songs.filter((song) =>
    [song.title, song.artist, song.album, song.genre, song.mood]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword.value)
  )
  return sortByRelevance(matched, (song) => song.title)
})

const playlistResults = computed(() => {
  if (!normalizedKeyword.value) return []
  const matched = playlists.filter((playlist) =>
    [playlist.title, playlist.description, playlist.genre, playlist.mood, playlist.era]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword.value)
  )
  return sortByRelevance(matched, (playlist) => playlist.title)
})

const artistResults = computed(() => {
  if (!normalizedKeyword.value) return []
  const matched = allArtists.filter((artist) =>
    [artist.name, artist.genre, artist.region]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword.value)
  )
  return sortByRelevance(matched, (artist) => artist.name)
})

const hotSearches = computed(() => {
  const top = [...allArtists]
    .sort((a, b) => b.songCount - a.songCount)
    .slice(0, 4)
    .map((artist) => artist.name)
  return [...top, '流行', '民谣', '轻音乐', '甜度100%'].slice(0, 8)
})

function addHistory(term) {
  addSearchHistory(term)
}

function clearHistory() {
  clearSearchHistory()
}

function commitSearch(term) {
  const value = term.trim()
  if (!value) return
  keyword.value = value
  addHistory(value)
}

function submitKeyword() {
  commitSearch(keyword.value)
}

function clearKeyword() {
  keyword.value = ''
  searchInput.value?.focus()
}

function highlight(text) {
  const word = keyword.value.trim()
  if (!word) return [{ text, match: false }]
  const lowerText = text.toLowerCase()
  const lowerWord = word.toLowerCase()
  const segments = []
  let start = 0
  let index = lowerText.indexOf(lowerWord)

  while (index !== -1) {
    if (index > start) segments.push({ text: text.slice(start, index), match: false })
    segments.push({ text: text.slice(index, index + word.length), match: true })
    start = index + word.length
    index = lowerText.indexOf(lowerWord, start)
  }

  if (start < text.length) segments.push({ text: text.slice(start), match: false })
  return segments.length ? segments : [{ text, match: false }]
}

function playSong(song, list) {
  playerStore.playSong(song, list)
}

function playPlaylist(playlist) {
  playerStore.playAll(getPlaylistSongs(playlist))
}

function openPlaylist(id) {
  router.push({ name: 'playlist', params: { id } })
}

function openArtist(artist) {
  router.push({ name: 'artist', query: { q: artist.name } })
}
</script>

<template>
  <div class="functional-page search-page">
    <h1 class="functional-title">搜索</h1>

    <div class="search-box">
      <Icon name="search" class="search-box-icon" :size="18" />
      <input
        ref="searchInput"
        v-model="keyword"
        class="search-input"
        type="search"
        autocomplete="off"
        placeholder="搜索歌曲、歌单、歌手"
        aria-label="搜索"
        @keydown.enter.prevent="submitKeyword"
      />
      <button
        v-if="keyword"
        type="button"
        class="search-clear"
        aria-label="清除"
        title="清除"
        @click="clearKeyword"
      >
        <Icon name="close" :size="16" />
      </button>
    </div>

    <div v-if="!hasKeyword" class="search-guide">
      <section class="search-hot">
        <h2 class="search-block-title">热门搜索</h2>
        <div class="search-chips">
          <button
            v-for="term in hotSearches"
            :key="term"
            type="button"
            class="search-chip"
            @click="commitSearch(term)"
          >
            {{ term }}
          </button>
        </div>
      </section>

      <section v-if="searchHistory.length" class="search-history">
        <div class="search-history-head">
          <h2 class="search-block-title">历史搜索</h2>
          <button type="button" class="search-history-clear" @click="clearHistory">清空</button>
        </div>
        <div class="search-chips">
          <button
            v-for="term in searchHistory"
            :key="term"
            type="button"
            class="search-chip"
            @click="commitSearch(term)"
          >
            {{ term }}
          </button>
        </div>
      </section>

      <div class="search-guide-tip">
        <Icon name="search" :size="44" />
        <p>输入关键词，搜索歌曲、歌单和歌手</p>
      </div>
    </div>

    <template v-else>
      <div class="search-summary">
        <Icon name="search" :size="16" />
        <span class="search-summary-word">“{{ keyword.trim() }}”</span>
        <span class="search-summary-sep" aria-hidden="true"></span>
        <span
          >歌曲 <b>{{ songResults.length }}</b></span
        >
        <span
          >歌单 <b>{{ playlistResults.length }}</b></span
        >
        <span
          >歌手 <b>{{ artistResults.length }}</b></span
        >
      </div>

      <div class="search-tabs" role="tablist" aria-label="搜索结果分类">
        <button
          type="button"
          class="search-tab"
          role="tab"
          :aria-selected="activeTab === 'song'"
          :class="{ active: activeTab === 'song' }"
          @click="activeTab = 'song'"
        >
          <Icon name="music-note" :size="16" />
          <span>歌曲</span>
          <span class="search-tab-badge">{{ songResults.length }}</span>
        </button>
        <button
          type="button"
          class="search-tab"
          role="tab"
          :aria-selected="activeTab === 'playlist'"
          :class="{ active: activeTab === 'playlist' }"
          @click="activeTab = 'playlist'"
        >
          <Icon name="list" :size="16" />
          <span>歌单</span>
          <span class="search-tab-badge">{{ playlistResults.length }}</span>
        </button>
        <button
          type="button"
          class="search-tab"
          role="tab"
          :aria-selected="activeTab === 'artist'"
          :class="{ active: activeTab === 'artist' }"
          @click="activeTab = 'artist'"
        >
          <Icon name="star" :size="16" />
          <span>歌手</span>
          <span class="search-tab-badge">{{ artistResults.length }}</span>
        </button>
      </div>

      <template v-if="activeTab === 'song'">
        <div
          v-if="songResults.length"
          class="functional-list"
          role="tabpanel"
          aria-label="歌曲结果"
        >
          <div
            v-for="song in songResults"
            :key="song.id"
            class="functional-row search-row has-add-action"
            :class="{ playing: currentSong?.id === song.id }"
            @click="playSong(song, songResults)"
          >
            <button type="button" class="row-play" @click.stop="playSong(song, songResults)">
              <Icon
                :name="currentSong?.id === song.id && playerStore.isPlaying ? 'pause' : 'play'"
              />
            </button>
            <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
            <div class="search-row-main">
              <strong>
                <template v-for="(seg, i) in highlight(song.title)" :key="`t${i}`">
                  <mark v-if="seg.match">{{ seg.text }}</mark
                  ><template v-else>{{ seg.text }}</template>
                </template>
              </strong>
              <button
                type="button"
                class="search-artist"
                @click.stop="openArtist({ name: song.artist })"
              >
                {{ song.artist }}
              </button>
            </div>
            <span>{{ song.album }}</span>
            <span>{{ song.duration }}</span>
            <div class="song-action-group">
              <FavoriteSongButton :song="song" />
              <AddToPlaylistButton :song="song" />
            </div>
          </div>
        </div>
        <div v-else class="functional-empty">没有找到相关歌曲</div>
      </template>

      <template v-else-if="activeTab === 'playlist'">
        <div
          v-if="playlistResults.length"
          class="search-playlist-grid"
          role="tabpanel"
          aria-label="歌单结果"
        >
          <article
            v-for="playlist in playlistResults"
            :key="playlist.id"
            class="search-playlist-card"
          >
            <div
              class="search-playlist-cover"
              role="button"
              tabindex="0"
              :aria-label="`打开歌单 ${playlist.title}`"
              @click="openPlaylist(playlist.id)"
              @keydown.enter.space.prevent="openPlaylist(playlist.id)"
            >
              <img :src="playlist.cover" :alt="playlist.title" loading="lazy" decoding="async" />
              <button
                type="button"
                class="search-playlist-play"
                title="播放"
                @click.stop="playPlaylist(playlist)"
              >
                <Icon name="play" />
              </button>
            </div>
            <h3
              class="search-playlist-title"
              role="button"
              tabindex="0"
              :aria-label="`打开歌单 ${playlist.title}`"
              @click="openPlaylist(playlist.id)"
              @keydown.enter.space.prevent="openPlaylist(playlist.id)"
            >
              <template v-for="(seg, i) in highlight(playlist.title)" :key="i">
                <mark v-if="seg.match">{{ seg.text }}</mark
                ><template v-else>{{ seg.text }}</template>
              </template>
            </h3>
            <p class="search-playlist-meta">{{ playlist.genre }} · {{ playlist.mood }}</p>
          </article>
        </div>
        <div v-else class="functional-empty">没有找到相关歌单</div>
      </template>

      <template v-else>
        <div
          v-if="artistResults.length"
          class="artist-results"
          role="tabpanel"
          aria-label="歌手结果"
        >
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
            <span class="artist-result-name">
              <template v-for="(seg, i) in highlight(artist.name)" :key="i">
                <mark v-if="seg.match">{{ seg.text }}</mark
                ><template v-else>{{ seg.text }}</template>
              </template>
            </span>
            <span class="artist-result-meta"
              >{{ artist.region }} · {{ artist.songCount }} 首歌</span
            >
          </button>
        </div>
        <div v-else class="functional-empty">没有找到相关歌手</div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.search-box {
  position: relative;
}

.search-box-icon {
  position: absolute;
  top: 50%;
  left: 16px;
  z-index: 1;
  color: var(--text-muted);
  pointer-events: none;
  transform: translateY(-50%);
}

.search-box .search-input {
  height: 56px;
  padding: 0 46px 0 46px;
  font-size: 16px;
}

.search-box .search-input::-webkit-search-cancel-button,
.search-box .search-input::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}

.search-box .search-input::-ms-clear {
  display: none;
}

.search-clear {
  position: absolute;
  top: 50%;
  right: 10px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: rgba(25, 25, 25, 0.08);
  color: var(--text-secondary);
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.search-clear:hover {
  background: rgba(255, 105, 157, 0.16);
  color: var(--brand-strong);
}

.search-guide {
  margin-top: 8px;
}

.search-hot,
.search-history {
  margin-bottom: 24px;
}

.search-block-title {
  margin: 0 0 12px;
  font-size: 16px;
  letter-spacing: 1px;
  font-weight: 900;
}

.search-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.search-history-clear {
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.search-history-clear:hover {
  color: var(--brand-strong);
}

.search-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-chip {
  padding: 8px 16px;
  border: 1px solid rgba(25, 25, 25, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    color 0.18s ease,
    border-color 0.18s ease;
}

.search-chip:hover {
  color: var(--brand-strong);
  border-color: rgba(255, 105, 157, 0.4);
}

.search-guide-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 20px;
  border: 1px dashed rgba(25, 25, 25, 0.2);
  border-radius: 12px;
  color: var(--brand-strong);
  text-align: center;
}

.search-guide-tip p {
  margin: 0;
  color: var(--text-secondary);
}

.search-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0 16px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.search-summary-word {
  color: var(--text);
}

.search-summary-sep {
  width: 1px;
  height: 16px;
  background: rgba(25, 25, 25, 0.12);
}

.search-summary b {
  color: var(--brand-strong);
  font-weight: 900;
}

.search-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 22px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  background: var(--surface);
}

.search-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-tab:hover {
  color: var(--brand-strong);
  background: rgba(255, 105, 157, 0.08);
}

.search-tab.active {
  background: var(--brand);
  color: #fff;
  box-shadow: 0 6px 14px rgba(255, 126, 179, 0.28);
}

.search-tab-badge {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.08);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
}

.search-tab.active .search-tab-badge {
  background: rgba(255, 255, 255, 0.28);
  color: #fff;
}

.search-playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 22px 18px;
}

.search-playlist-card {
  min-width: 0;
}

.search-playlist-cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(93, 54, 70, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.search-playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.search-playlist-card:hover .search-playlist-cover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(93, 54, 70, 0.16);
}

.search-playlist-card:hover .search-playlist-cover img {
  transform: scale(1.06);
}

.search-playlist-play {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--brand-strong);
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

.search-playlist-card:hover .search-playlist-play {
  opacity: 1;
  transform: translateY(0);
}

.search-playlist-play:hover {
  background: var(--brand);
  color: #fff;
}

.search-playlist-title {
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

.search-playlist-title:hover {
  color: var(--brand-strong);
}

.search-playlist-meta {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.search-row {
  cursor: pointer;
}

.search-row:hover {
  background: rgba(255, 255, 255, 0.78);
}

.search-row-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.search-row-main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-artist {
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.search-artist:hover {
  color: var(--brand-strong);
}

mark {
  padding: 0 1px;
  border-radius: 3px;
  background: rgba(255, 126, 179, 0.18);
  color: var(--brand-strong);
}

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

.artist-result-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 26px rgba(93, 54, 70, 0.12);
  border-color: var(--brand);
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
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 700px) {
  .search-tabs {
    display: flex;
    width: 100%;
    overflow-x: auto;
  }

  .search-tab {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}
</style>
