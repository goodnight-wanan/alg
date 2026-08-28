<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getPlaylistById, getPlaylistSongs, getSongById } from '../data/musicData'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import UserCard from '../components/UserCard.vue'

const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()
const activeTab = ref('favorite')
const newPlaylistName = ref('')
const selectedCustomId = ref('')
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
const selectedCustomPlaylist = computed(() =>
  customPlaylists.value.find((playlist) => playlist.id === selectedCustomId.value)
)

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

function createPlaylist() {
  const result = userStore.createCustomPlaylist(newPlaylistName.value)
  if (!result.ok) return
  newPlaylistName.value = ''
  selectedCustomId.value = result.playlist.id
}

function playCustomPlaylist(playlist) {
  if (playlist.songs.length) playerStore.playAll(playlist.songs)
}

function selectCustomPlaylist(playlist) {
  selectedCustomId.value = selectedCustomId.value === playlist.id ? '' : playlist.id
}

function removeCustomSong(playlistId, songId) {
  userStore.removeSongFromCustomPlaylist(playlistId, songId)
}

function deleteCustomPlaylist(playlistId) {
  if (!window.confirm('确定删除这个歌单吗？')) return
  userStore.deleteCustomPlaylist(playlistId)
  if (selectedCustomId.value === playlistId) selectedCustomId.value = ''
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
                title="播放"
                @click.stop="playPlaylist(playlist)"
              >
                <Icon name="play" :size="18" />
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
        <form class="custom-playlist-create" @submit.prevent="createPlaylist">
          <input v-model.trim="newPlaylistName" type="text" maxlength="30" placeholder="给新歌单起个名字" />
          <button type="submit">创建歌单</button>
        </form>
        <div v-if="customPlaylists.length" class="functional-grid custom-playlist-grid">
          <article v-for="playlist in customPlaylists" :key="playlist.id" class="mine-card custom-playlist-card">
            <button type="button" class="custom-playlist-open" @click="selectCustomPlaylist(playlist)">
              <span class="mine-card-cover"><img :src="playlist.cover" :alt="playlist.name" /></span>
              <strong class="mine-card-title">{{ playlist.name }}</strong>
              <small>{{ playlist.songs.length }} 首歌曲</small>
            </button>
            <button type="button" class="mine-card-play" title="播放歌单" @click="playCustomPlaylist(playlist)"><Icon name="play" :size="18" /></button>
            <button type="button" class="mine-card-remove" title="删除歌单" @click="deleteCustomPlaylist(playlist.id)"><Icon name="close" :size="16" /></button>
          </article>
        </div>
        <div v-else class="mine-empty"><Icon name="list" :size="48" /><p>还没有自己的歌单</p></div>
        <section v-if="selectedCustomPlaylist" class="custom-playlist-detail">
          <h2>{{ selectedCustomPlaylist.name }}</h2>
          <div v-if="selectedCustomPlaylist.songs.length" class="functional-list">
            <div v-for="song in selectedCustomPlaylist.songs" :key="song.id" class="mine-row has-add-action has-remove-action" @click="playSong(song, selectedCustomPlaylist.songs)">
              <button type="button" class="row-play" @click.stop="playSong(song, selectedCustomPlaylist.songs)"><Icon name="play" /></button>
              <img :src="song.cover" :alt="song.title" />
              <div class="song-meta"><strong>{{ song.title }}</strong><span class="song-artist">{{ song.artist }}</span></div>
              <span>{{ song.album }}</span><span>{{ song.duration }}</span>
              <AddToPlaylistButton :song="song" />
              <button type="button" class="row-remove" title="从歌单移除" @click.stop="removeCustomSong(selectedCustomPlaylist.id, song.id)"><Icon name="close" :size="18" /></button>
            </div>
          </div>
          <div v-else class="mine-empty"><p>这个歌单还没有歌曲</p></div>
        </section>
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
              <AddToPlaylistButton :song="song" />
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

.mine-page :deep(.user-card-logout) { display: none; }
.custom-playlist-create { display: flex; gap: 10px; margin-bottom: 22px; }
.custom-playlist-create input { min-width: 0; height: 42px; flex: 1; padding: 0 14px; border: 1px solid rgba(25, 25, 25, .14); border-radius: 9px; outline: none; }
.custom-playlist-create input:focus { border-color: var(--brand-strong); box-shadow: 0 0 0 3px rgba(233, 78, 119, .12); }
.custom-playlist-create button { padding: 0 20px; border-radius: 9px; background: var(--brand-strong); color: #fff; font-weight: 800; }
.custom-playlist-card { position: relative; }
.custom-playlist-open { width: 100%; padding: 0; background: transparent; color: inherit; text-align: left; }
.custom-playlist-open .mine-card-cover { display: block; }
.custom-playlist-open small { color: var(--text-secondary); }
.custom-playlist-detail { margin-top: 28px; padding-top: 22px; border-top: 1px solid rgba(25, 25, 25, .08); }

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
    grid-template-columns: 38px 48px minmax(0, 1fr) 40px;
  }

  .mine-row.has-add-action.has-remove-action {
    grid-template-columns: 38px 48px minmax(0, 1fr) 40px 36px;
  }
}
</style>
