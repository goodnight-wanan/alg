<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getPlaylistById, getPlaylistSongs, getSongById, playlists } from '../data/musicData'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { showNotice } from '../utils/notice'
import UserCard from '../components/UserCard.vue'

const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()
const activeTab = ref('favorite')
const currentSong = computed(() => playerStore.currentSong)

const favoriteSongs = computed(() =>
  userStore.favoriteSongs.map(getSongById).filter(Boolean)
)
const favoritePlaylists = computed(() =>
  userStore.favoritePlaylists.map(getPlaylistById).filter(Boolean)
)
const historySongs = computed(() =>
  userStore.playHistory
    .map((item) => {
      const song = getSongById(item.id)
      return song ? { ...song, playedAt: item.time } : null
    })
    .filter(Boolean)
)

const recommendedPlaylists = computed(() => {
  const favoriteIds = new Set(userStore.favoritePlaylists)
  const moodSet = new Set(historySongs.value.map((s) => s.mood).filter(Boolean))
  const genreSet = new Set(historySongs.value.map((s) => s.genre).filter(Boolean))

  const pool = playlists.filter((p) => !favoriteIds.has(p.id))
  if (!pool.length) return []

  if (moodSet.size || genreSet.size) {
    const matched = pool.filter((p) => moodSet.has(p.mood) || genreSet.has(p.genre))
    if (matched.length) return matched.slice(0, 6)
  }

  return pool.slice(0, 6)
})

const playRanking = computed(() =>
  Object.entries(userStore.playCounts)
    .map(([id, count]) => ({ song: getSongById(id), count }))
    .filter((item) => item.song && item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
)

const rankSongs = computed(() => playRanking.value.map((item) => item.song))

const quickActions = [
  { label: '收藏歌曲', icon: 'heart', target: 'favorite' },
  { label: '收藏歌单', icon: 'list', target: 'playlist' },
  { label: '最近播放', icon: 'clock', target: 'history' },
  { label: '听歌排行', icon: 'chart', target: 'rank' },
  { label: '每日推荐', icon: 'star', target: 'daily' },
  { label: '私人FM', icon: 'radio', target: 'fm' }
]

function handleQuickAction(action) {
  if (action.target === 'daily') {
    router.push('/')
    return
  }
  if (action.target === 'fm') {
    showNotice('私人 FM 为演示功能，暂未开放')
    return
  }
  activeTab.value = action.target
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

function removeFavoriteSong(songId) {
  userStore.toggleFavoriteSong(songId)
}

function removeFavoritePlaylist(playlistId) {
  userStore.toggleFavoritePlaylist(playlistId)
}

function clearHistory() {
  userStore.clearPlayHistory()
}

function formatTimeAgo(time) {
  if (!time) return ''
  const diff = Date.now() - time
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return new Date(time).toLocaleDateString()
}
</script>

<template>
  <div class="functional-page mine-page">
    <h1 class="functional-title">我的音乐</h1>

    <UserCard show-stats />

    <section class="quick-actions" aria-label="快捷入口">
      <button
        v-for="action in quickActions"
        :key="action.label"
        type="button"
        class="quick-action"
        @click="handleQuickAction(action)"
      >
        <span class="quick-icon"><Icon :name="action.icon" :size="22" /></span>
        <span class="quick-label">{{ action.label }}</span>
      </button>
    </section>

    <section v-if="recommendedPlaylists.length" class="recommend-section">
      <div class="section-head">
        <h2 class="section-title">猜你喜欢</h2>
        <span class="section-sub">根据你的口味推荐</span>
      </div>
      <div class="functional-grid">
        <div
          v-for="playlist in recommendedPlaylists"
          :key="playlist.id"
          class="mine-card"
          @click="openPlaylist(playlist.id)"
        >
          <div class="mine-card-cover">
            <img :src="playlist.cover" :alt="playlist.title" loading="lazy" decoding="async" />
            <button type="button" class="mine-card-play" title="播放" @click.stop="playPlaylist(playlist)">
              <Icon name="play" :size="18" />
            </button>
          </div>
          <p class="mine-card-title">{{ playlist.title }}</p>
          <p class="mine-card-meta">{{ playlist.genre }} · {{ playlist.mood }}</p>
        </div>
      </div>
    </section>

    <div class="functional-tabs">
      <button type="button" :class="{ active: activeTab === 'favorite' }" @click="activeTab = 'favorite'">
        收藏歌曲 <span class="tab-count">{{ favoriteSongs.length }}</span>
      </button>
      <button type="button" :class="{ active: activeTab === 'playlist' }" @click="activeTab = 'playlist'">
        收藏歌单 <span class="tab-count">{{ favoritePlaylists.length }}</span>
      </button>
      <button type="button" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
        最近播放 <span class="tab-count">{{ historySongs.length }}</span>
      </button>
      <button type="button" :class="{ active: activeTab === 'rank' }" @click="activeTab = 'rank'">
        听歌排行 <span class="tab-count">{{ playRanking.length }}</span>
      </button>
    </div>

    <template v-if="activeTab === 'favorite'">
      <div v-if="favoriteSongs.length" class="functional-list">
        <div
          v-for="song in favoriteSongs"
          :key="song.id"
          class="mine-row"
          :class="{ playing: currentSong?.id === song.id }"
          @click="playSong(song, favoriteSongs)"
        >
          <button type="button" class="row-play" @click.stop="playSong(song, favoriteSongs)">
            <Icon :name="currentSong?.id === song.id && playerStore.isPlaying ? 'pause' : 'play'" />
          </button>
          <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
          <div class="song-meta">
            <strong>{{ song.title }}</strong>
            <span class="song-artist">{{ song.artist }}</span>
          </div>
          <span>{{ song.album }}</span>
          <span>{{ song.duration }}</span>
          <button type="button" class="row-remove" title="取消收藏" @click.stop="removeFavoriteSong(song.id)">
            <Icon name="heart" :size="18" />
          </button>
        </div>
      </div>
      <div v-else class="mine-empty">
        <Icon name="heart-outline" :size="48" />
        <p>还没有收藏歌曲</p>
        <RouterLink to="/" class="empty-action">去发现音乐</RouterLink>
      </div>
    </template>

    <template v-else-if="activeTab === 'playlist'">
      <div v-if="favoritePlaylists.length" class="functional-grid">
        <div
          v-for="playlist in favoritePlaylists"
          :key="playlist.id"
          class="mine-card"
          @click="openPlaylist(playlist.id)"
        >
          <div class="mine-card-cover">
            <img :src="playlist.cover" :alt="playlist.title" loading="lazy" decoding="async" />
            <button type="button" class="mine-card-play" title="播放" @click.stop="playPlaylist(playlist)">
              <Icon name="play" :size="18" />
            </button>
            <button type="button" class="mine-card-remove" title="取消收藏" @click.stop="removeFavoritePlaylist(playlist.id)">
              <Icon name="heart" :size="16" />
            </button>
          </div>
          <p class="mine-card-title">{{ playlist.title }}</p>
          <p class="mine-card-meta">{{ playlist.genre }} · {{ playlist.mood }}</p>
        </div>
      </div>
      <div v-else class="mine-empty">
        <Icon name="list" :size="48" />
        <p>还没有收藏歌单</p>
        <RouterLink to="/category" class="empty-action">去逛逛歌单</RouterLink>
      </div>
    </template>

    <template v-else-if="activeTab === 'history'">
      <div v-if="historySongs.length" class="history-head">
        <span class="history-count">共 {{ historySongs.length }} 首</span>
        <button type="button" class="clear-history" @click="clearHistory">清空播放记录</button>
      </div>
      <div v-if="historySongs.length" class="functional-list">
        <div
          v-for="song in historySongs"
          :key="song.id"
          class="mine-row"
          :class="{ playing: currentSong?.id === song.id }"
          @click="playSong(song, historySongs)"
        >
          <button type="button" class="row-play" @click.stop="playSong(song, historySongs)">
            <Icon :name="currentSong?.id === song.id && playerStore.isPlaying ? 'pause' : 'play'" />
          </button>
          <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
          <div class="song-meta">
            <strong>{{ song.title }}</strong>
            <span class="song-artist">{{ song.artist }}</span>
          </div>
          <span>{{ song.album }}</span>
          <span>{{ formatTimeAgo(song.playedAt) }}</span>
        </div>
      </div>
      <div v-else class="mine-empty">
        <Icon name="clock" :size="48" />
        <p>还没有播放记录</p>
        <RouterLink to="/" class="empty-action">去发现音乐</RouterLink>
      </div>
    </template>

    <template v-else>
      <div v-if="playRanking.length" class="functional-list">
        <div
          v-for="(item, index) in playRanking"
          :key="item.song.id"
          class="mine-rank-row"
          :class="{ playing: currentSong?.id === item.song.id }"
          @click="playSong(item.song, rankSongs)"
        >
          <span class="rank-num">{{ String(index + 1).padStart(2, '0') }}</span>
          <button type="button" class="row-play" @click.stop="playSong(item.song, rankSongs)">
            <Icon :name="currentSong?.id === item.song.id && playerStore.isPlaying ? 'pause' : 'play'" />
          </button>
          <img :src="item.song.cover" :alt="item.song.title" loading="lazy" decoding="async" />
          <div class="song-meta">
            <strong>{{ item.song.title }}</strong>
            <span class="song-artist">{{ item.song.artist }}</span>
          </div>
          <span class="rank-count">播放 {{ item.count }} 次</span>
        </div>
      </div>
      <div v-else class="mine-empty">
        <Icon name="chart" :size="48" />
        <p>还没有播放记录</p>
        <RouterLink to="/" class="empty-action">去发现音乐</RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tab-count {
  margin-left: 4px;
  color: #b0a8ac;
  font-size: 12px;
  font-weight: 700;
}

.functional-tabs button.active .tab-count {
  color: #e94e77;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.quick-action:hover {
  transform: translateY(-3px);
  border-color: rgba(255, 105, 157, 0.4);
  box-shadow: 0 10px 22px rgba(93, 54, 70, 0.12);
}

.quick-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 105, 157, 0.14);
  color: #e94e77;
}

.quick-label {
  font-size: 13px;
  font-weight: 800;
  color: #665d63;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 20px;
  letter-spacing: 1px;
  font-weight: 1000;
}

.section-sub {
  color: #8a7d83;
  font-size: 12px;
}

.recommend-section {
  margin-bottom: 30px;
}

.mine-row {
  display: grid;
  grid-template-columns: 42px 56px minmax(0, 1fr) minmax(90px, auto) minmax(80px, auto) 40px;
  align-items: center;
  gap: 12px;
  min-height: 70px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.mine-row:hover {
  background: rgba(255, 255, 255, 0.78);
}

.mine-row.playing {
  border-color: rgba(255, 105, 157, 0.5);
  background: rgba(255, 192, 203, 0.28);
}

.mine-row img,
.mine-rank-row img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
}

.song-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.song-meta strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}

.song-artist {
  color: #8a7d83;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mine-row > span {
  color: #665d63;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-remove {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #e94e77;
  cursor: pointer;
  transition: background 0.18s ease;
}

.row-remove:hover {
  background: rgba(255, 105, 157, 0.14);
}

.mine-rank-row {
  display: grid;
  grid-template-columns: 40px 42px 56px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 70px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.mine-rank-row:hover {
  background: rgba(255, 255, 255, 0.78);
}

.mine-rank-row.playing {
  border-color: rgba(255, 105, 157, 0.5);
  background: rgba(255, 192, 203, 0.28);
}

.rank-num {
  text-align: center;
  font-size: 16px;
  font-weight: 900;
  color: #a8afba;
}

.mine-rank-row:nth-child(1) .rank-num {
  color: #f5b301;
  font-size: 20px;
}

.mine-rank-row:nth-child(2) .rank-num {
  color: #b7c0cc;
  font-size: 19px;
}

.mine-rank-row:nth-child(3) .rank-num {
  color: #cd8b62;
  font-size: 18px;
}

.rank-count {
  color: #665d63;
  font-size: 13px;
  white-space: nowrap;
}

.mine-card {
  position: relative;
  min-width: 0;
  cursor: pointer;
}

.mine-card-cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
}

.mine-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.mine-card:hover .mine-card-cover img {
  transform: scale(1.06);
}

.mine-card-play {
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
  color: #e94e77;
  box-shadow: 0 6px 14px rgba(93, 54, 70, 0.2);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease, color 0.2s ease;
  cursor: pointer;
}

.mine-card:hover .mine-card-play {
  opacity: 1;
  transform: translateY(0);
}

.mine-card-play:hover {
  background: #ff7eb3;
  color: #fff;
}

.mine-card-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #e94e77;
  box-shadow: 0 4px 10px rgba(93, 54, 70, 0.2);
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.mine-card:hover .mine-card-remove {
  opacity: 1;
}

.mine-card-title {
  margin: 10px 0 4px;
  overflow: hidden;
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mine-card-meta {
  margin: 0;
  color: #8a7d83;
  font-size: 12px;
  font-weight: 600;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.history-count {
  color: #665d63;
  font-size: 13px;
  font-weight: 700;
}

.clear-history {
  padding: 7px 16px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: #665d63;
  font-weight: 700;
  cursor: pointer;
}

.clear-history:hover {
  color: #e94e77;
}

.mine-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 60px 20px;
  border: 1px dashed rgba(25, 25, 25, 0.2);
  border-radius: 12px;
  text-align: center;
  color: #e94e77;
}

.mine-empty p {
  margin: 4px 0 8px;
  color: #665d63;
}

.empty-action {
  padding: 8px 18px;
  border-radius: 999px;
  background: #ff7eb3;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.empty-action:hover {
  background: #f76a9f;
}

@media (max-width: 960px) {
  .quick-actions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .mine-row {
    grid-template-columns: 42px 52px minmax(0, 1fr) 40px;
  }

  .mine-row > span {
    display: none;
  }
}

@media (max-width: 700px) {
  .mine-row {
    grid-template-columns: 38px 48px minmax(0, 1fr) 36px;
    gap: 8px;
    padding: 10px;
  }

  .mine-rank-row {
    grid-template-columns: 32px 38px 44px minmax(0, 1fr);
    gap: 8px;
    padding: 10px;
  }

  .mine-rank-row .rank-count {
    display: none;
  }
}
</style>