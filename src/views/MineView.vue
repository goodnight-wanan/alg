<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlaylistById, getPlaylistSongs, getSongById } from '../data/catalogData'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { showNotice } from '../utils/notice'
import UserCard from '../components/UserCard.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()
const availableTabs = ['favorite', 'playlist', 'custom', 'history']
const activeTab = ref(availableTabs.includes(route.query.tab) ? route.query.tab : 'favorite')
const newPlaylistName = ref('')
const currentSong = computed(() => playerStore.currentSong)

const favoriteSongs = computed(() => userStore.favoriteSongs.map(getSongById).filter(Boolean))
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
const customPlaylists = computed(() =>
  userStore.customPlaylists.map((playlist) => {
    const playlistSongs = playlist.songIds.map(getSongById).filter(Boolean)
    return {
      ...playlist,
      songs: playlistSongs,
      cover: playlistSongs.at(-1)?.cover || '/assets/imgs/homepage/song_list/list1.webp'
    }
  })
)
function playSong(song, list) {
  playerStore.playSong(song, list)
}

function playPlaylist(playlist) {
  playerStore.playAll(getPlaylistSongs(playlist))
}

function isPlaylistPlaying(playlist) {
  const playlistSongs = getPlaylistSongs(playlist)
  return playerStore.isListActive(playlistSongs) && playerStore.isPlaying
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

function createPlaylist() {
  const result = userStore.createCustomPlaylist(newPlaylistName.value)
  showNotice(result.message, result.ok ? 'success' : 'error')
  if (!result.ok) return
  newPlaylistName.value = ''
}

function playCustomPlaylist(playlist) {
  if (playlist.songs.length) playerStore.playAll(playlist.songs)
}

function deleteCustomPlaylist(playlistId) {
  if (!window.confirm('确定删除这个歌单吗？')) return
  userStore.deleteCustomPlaylist(playlistId)
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

    <div class="mine-tabs" role="tablist">
      <button
        type="button"
        class="mine-tab"
        role="tab"
        :aria-selected="activeTab === 'favorite'"
        :class="{ active: activeTab === 'favorite' }"
        @click="activeTab = 'favorite'"
      >
        <Icon name="heart" :size="16" />
        <span>收藏歌曲</span>
        <span class="tab-badge">{{ favoriteSongs.length }}</span>
      </button>
      <button
        type="button"
        class="mine-tab"
        role="tab"
        :aria-selected="activeTab === 'playlist'"
        :class="{ active: activeTab === 'playlist' }"
        @click="activeTab = 'playlist'"
      >
        <Icon name="list" :size="16" />
        <span>收藏歌单</span>
        <span class="tab-badge">{{ favoritePlaylists.length }}</span>
      </button>
      <button
        type="button"
        class="mine-tab"
        role="tab"
        :aria-selected="activeTab === 'custom'"
        :class="{ active: activeTab === 'custom' }"
        @click="activeTab = 'custom'"
      >
        <Icon name="list" :size="16" />
        <span>我的歌单</span>
        <span class="tab-badge">{{ customPlaylists.length }}</span>
      </button>
      <button
        type="button"
        class="mine-tab"
        role="tab"
        :aria-selected="activeTab === 'history'"
        :class="{ active: activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        <Icon name="clock" :size="16" />
        <span>最近播放</span>
        <span class="tab-badge">{{ historySongs.length }}</span>
      </button>
    </div>

    <Transition name="tab" mode="out-in">
      <div v-if="activeTab === 'favorite'" key="favorite">
        <div v-if="favoriteSongs.length" class="functional-list">
          <div
            v-for="song in favoriteSongs"
            :key="song.id"
            class="mine-row has-add-action has-remove-action"
            :class="{ playing: currentSong?.id === song.id }"
            @click="playSong(song, favoriteSongs)"
          >
            <button type="button" class="row-play" @click.stop="playSong(song, favoriteSongs)">
              <Icon
                :name="currentSong?.id === song.id && playerStore.isPlaying ? 'pause' : 'play'"
              />
            </button>
            <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
            <div class="song-meta">
              <strong>{{ song.title }}</strong>
              <span class="song-artist">{{ song.artist }}</span>
            </div>
            <span>{{ song.album }}</span>
            <span>{{ song.duration }}</span>
            <AddToPlaylistButton :song="song" />
            <button
              type="button"
              class="row-remove"
              title="取消收藏"
              @click.stop="removeFavoriteSong(song.id)"
            >
              <Icon name="heart" :size="18" />
            </button>
          </div>
        </div>
        <div v-else class="mine-empty">
          <Icon name="heart-outline" :size="48" />
          <p>还没有收藏歌曲</p>
          <RouterLink to="/" class="empty-action">去发现音乐</RouterLink>
        </div>
      </div>

      <div v-else-if="activeTab === 'playlist'" key="playlist">
        <div v-if="favoritePlaylists.length" class="functional-grid">
          <div
            v-for="playlist in favoritePlaylists"
            :key="playlist.id"
            class="mine-card"
            @click="openPlaylist(playlist.id)"
          >
            <div class="mine-card-cover">
              <img :src="playlist.cover" :alt="playlist.title" loading="lazy" decoding="async" />
              <button
                type="button"
                class="mine-card-play"
                :title="isPlaylistPlaying(playlist) ? '暂停' : '播放'"
                :aria-label="`${isPlaylistPlaying(playlist) ? '暂停' : '播放'}歌单 ${playlist.title}`"
                @click.stop="playPlaylist(playlist)"
              >
                <Icon :name="isPlaylistPlaying(playlist) ? 'pause' : 'play'" :size="18" />
              </button>
              <button
                type="button"
                class="mine-card-remove"
                title="取消收藏"
                @click.stop="removeFavoritePlaylist(playlist.id)"
              >
                <Icon name="heart" :size="16" />
              </button>
            </div>
            <p class="mine-card-title">{{ playlist.title }}</p>
          </div>
        </div>
        <div v-else class="mine-empty">
          <Icon name="list" :size="48" />
          <p>还没有收藏歌单</p>
          <RouterLink to="/category" class="empty-action">去逛逛歌单</RouterLink>
        </div>
      </div>

      <div v-else-if="activeTab === 'custom'" key="custom">
        <template v-if="customPlaylists.length">
          <div class="custom-playlist-toolbar">
            <div>
              <strong>我的歌单</strong>
              <span>共 {{ customPlaylists.length }} 个自建歌单</span>
            </div>
            <form class="custom-playlist-create is-compact" @submit.prevent="createPlaylist">
              <input
                v-model.trim="newPlaylistName"
                type="text"
                maxlength="30"
                placeholder="歌单名称"
              />
              <button type="submit">新建</button>
            </form>
          </div>
          <div class="functional-grid custom-playlist-grid">
            <article
              v-for="playlist in customPlaylists"
              :key="playlist.id"
              class="mine-card custom-playlist-card"
              @click="openPlaylist(playlist.id)"
            >
              <div class="mine-card-cover">
                <img :src="playlist.cover" :alt="playlist.name" loading="lazy" decoding="async" />
                <button
                  type="button"
                  class="mine-card-play"
                  title="播放歌单"
                  @click.stop="playCustomPlaylist(playlist)"
                >
                  <Icon name="play" :size="18" />
                </button>
                <button
                  type="button"
                  class="mine-card-remove"
                  title="删除歌单"
                  @click.stop="deleteCustomPlaylist(playlist.id)"
                >
                  <Icon name="close" :size="16" />
                </button>
              </div>
              <p class="mine-card-title">{{ playlist.name }}</p>
              <small>{{ playlist.songs.length }} 首歌曲</small>
            </article>
          </div>
        </template>
        <div v-else class="custom-playlist-empty">
          <span class="custom-playlist-empty-icon"><Icon name="list" :size="38" /></span>
          <h2>暂无创建的歌单</h2>
          <p>创建一个专属歌单，把喜欢的歌曲慢慢收集起来。</p>
          <form class="custom-playlist-create is-empty" @submit.prevent="createPlaylist">
            <input
              v-model.trim="newPlaylistName"
              type="text"
              maxlength="30"
              placeholder="输入简短歌单名称"
            />
            <button type="submit">立即创建歌单</button>
          </form>
        </div>
      </div>

      <div v-else key="history">
        <template v-if="historySongs.length">
          <div class="history-head">
            <span class="history-count">共 {{ historySongs.length }} 首</span>
            <button type="button" class="clear-history" @click="clearHistory">清空播放记录</button>
          </div>
          <div class="functional-list">
            <div
              v-for="song in historySongs"
              :key="song.id"
              class="mine-row has-add-action"
              :class="{ playing: currentSong?.id === song.id }"
              @click="playSong(song, historySongs)"
            >
              <button type="button" class="row-play" @click.stop="playSong(song, historySongs)">
                <Icon
                  :name="currentSong?.id === song.id && playerStore.isPlaying ? 'pause' : 'play'"
                />
              </button>
              <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
              <div class="song-meta">
                <strong>{{ song.title }}</strong>
                <span class="song-artist">{{ song.artist }}</span>
              </div>
              <span>{{ song.album }}</span>
              <span>{{ formatTimeAgo(song.playedAt) }}</span>
              <div class="song-action-group">
                <FavoriteSongButton :song="song" />
                <AddToPlaylistButton :song="song" />
              </div>
            </div>
          </div>
        </template>
        <div v-else class="mine-empty">
          <Icon name="clock" :size="48" />
          <p>还没有播放记录</p>
          <RouterLink to="/" class="empty-action">去发现音乐</RouterLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mine-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 22px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  background: var(--surface);
}

.custom-playlist-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 14px;
  background: var(--surface);
}
.custom-playlist-toolbar > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.custom-playlist-toolbar strong {
  font-size: 17px;
}
.custom-playlist-toolbar span {
  color: var(--text-secondary);
  font-size: 13px;
}
.custom-playlist-create {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.custom-playlist-create input {
  width: 220px;
  height: 42px;
  padding: 0 14px;
  border: 1px solid rgba(25, 25, 25, 0.14);
  border-radius: 9px;
  outline: none;
  background: rgba(255, 255, 255, 0.78);
}
.custom-playlist-create input:focus {
  border-color: var(--brand-strong);
  box-shadow: 0 0 0 3px rgba(233, 78, 119, 0.12);
}
.custom-playlist-create button {
  min-height: 42px;
  padding: 0 20px;
  border-radius: 9px;
  background: var(--brand-strong);
  color: #fff;
  font-weight: 800;
  white-space: nowrap;
}
.custom-playlist-empty {
  display: flex;
  min-height: 300px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 42px 24px;
  border: 1px dashed rgba(233, 78, 119, 0.32);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.62);
  text-align: center;
}
.custom-playlist-empty-icon {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  margin-bottom: 16px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 126, 179, 0.22), rgba(255, 214, 214, 0.6));
  color: var(--brand-strong);
}
.custom-playlist-empty h2 {
  margin: 0;
  font-size: 22px;
}
.custom-playlist-empty > p {
  margin: 8px 0 22px;
  color: var(--text-secondary);
}
.custom-playlist-create.is-empty input {
  width: min(240px, 55vw);
}
.custom-playlist-card small {
  color: var(--text-secondary);
}

.mine-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.mine-tab:hover {
  color: var(--brand-strong);
  background: rgba(255, 105, 157, 0.08);
  transform: translateY(-1px);
}

.mine-tab.active {
  background: var(--brand);
  color: #fff;
  box-shadow: 0 6px 14px rgba(255, 126, 179, 0.28);
}

.mine-tab.active:hover {
  background: var(--brand);
  color: #fff;
}

.tab-badge {
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

.mine-tab.active .tab-badge {
  background: rgba(255, 255, 255, 0.28);
  color: #fff;
}

.tab-enter-active,
.tab-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tab-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.tab-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
  background: var(--surface);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.mine-row.has-add-action {
  grid-template-columns: 42px 56px minmax(0, 1fr) minmax(90px, auto) minmax(80px, auto) 90px;
}

.mine-row.has-add-action.has-remove-action {
  grid-template-columns: 42px 56px minmax(0, 1fr) minmax(90px, auto) minmax(80px, auto) 90px 40px;
}

.mine-row:hover {
  background: rgba(255, 255, 255, 0.78);
}

.mine-row.playing {
  border-color: rgba(255, 105, 157, 0.5);
  background: rgba(255, 192, 203, 0.28);
}

.mine-row img {
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
  color: var(--text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mine-row > span {
  color: var(--text-secondary);
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
  color: var(--brand-strong);
  cursor: pointer;
  transition: background 0.18s ease;
}

.row-remove:hover {
  background: rgba(255, 105, 157, 0.14);
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
  background: var(--surface);
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
  color: var(--brand-strong);
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

.mine-card:hover .mine-card-play {
  opacity: 1;
  transform: translateY(0);
}

.mine-card-play:hover {
  background: var(--brand);
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
  color: var(--brand-strong);
  box-shadow: 0 4px 10px rgba(93, 54, 70, 0.2);
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.mine-card:hover .mine-card-remove {
  opacity: 1;
}

.mine-card-title {
  margin: 10px 0 0;
  overflow: hidden;
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.history-count {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.clear-history {
  padding: 7px 16px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
}

.clear-history:hover {
  color: var(--brand-strong);
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
  color: var(--brand-strong);
}

.mine-empty p {
  margin: 4px 0 8px;
  color: var(--text-secondary);
}

.empty-action {
  padding: 8px 18px;
  border-radius: 999px;
  background: var(--brand);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.empty-action:hover {
  background: var(--brand-hover);
}

@media (max-width: 960px) {
  .mine-row {
    grid-template-columns: 42px 52px minmax(0, 1fr) 40px;
  }

  .mine-row > span {
    display: none;
  }

  .mine-row.has-add-action {
    grid-template-columns: 42px 52px minmax(0, 1fr) 90px;
  }

  .mine-row.has-add-action.has-remove-action {
    grid-template-columns: 42px 52px minmax(0, 1fr) 90px 40px;
  }
}

@media (max-width: 700px) {
  .mine-tabs {
    width: 100%;
    display: flex;
    overflow-x: auto;
  }

  .mine-tab {
    flex: 1 0 auto;
    justify-content: center;
    padding: 8px 10px;
    font-size: 13px;
  }

  .mine-row {
    grid-template-columns: 38px 48px minmax(0, 1fr) 36px;
    gap: 8px;
    padding: 10px;
  }

  .mine-row.has-add-action {
    grid-template-columns: 38px 48px minmax(0, 1fr) 80px;
  }

  .mine-row.has-add-action.has-remove-action {
    grid-template-columns: 38px 48px minmax(0, 1fr) 40px 36px;
  }

  .custom-playlist-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .custom-playlist-create.is-compact {
    width: 100%;
  }
  .custom-playlist-create.is-compact input {
    width: auto;
    min-width: 0;
    flex: 1;
  }
  .custom-playlist-create.is-empty {
    width: 100%;
    flex-direction: column;
  }
  .custom-playlist-create.is-empty input,
  .custom-playlist-create.is-empty button {
    width: min(280px, 100%);
  }
}
</style>
