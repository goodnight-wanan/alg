<script setup>
import { computed, ref } from 'vue'
import PlaylistCard from '../components/PlaylistCard.vue'
import SongRow from '../components/SongRow.vue'
import { getPlaylistById, getSongById } from '../data/musicData'
import { useUserStore } from '../stores/user'

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
</script>

<template>
  <div class="mine-view">
    <section class="user-card">
      <div class="user-avatar">{{ userStore.currentUser.username.slice(0, 1) }}</div>
      <div>
        <p class="eyebrow">MY MUSIC</p>
        <h1>{{ userStore.currentUser.username }}</h1>
        <p>{{ userStore.currentUser.email }}</p>
      </div>
      <button class="btn btn-ghost" type="button" @click="userStore.logout">退出登录</button>
    </section>

    <div class="tabs">
      <button
        type="button"
        :class="{ active: activeTab === 'favorite' }"
        @click="activeTab = 'favorite'"
      >
        收藏歌曲
      </button>
      <button
        type="button"
        :class="{ active: activeTab === 'playlist' }"
        @click="activeTab = 'playlist'"
      >
        收藏歌单
      </button>
      <button
        type="button"
        :class="{ active: activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        最近播放
      </button>
    </div>

    <template v-if="activeTab === 'favorite'">
      <div v-if="favoriteSongs.length" class="song-list">
        <SongRow
          v-for="(song, index) in favoriteSongs"
          :key="song.id"
          :song="song"
          :index="index"
          :queue="favoriteSongs"
        />
      </div>
      <div v-else class="empty-state">
        <div>
          <strong>还没有收藏歌曲</strong>
          <p>在歌曲右侧点击 ♡ 就能收藏到我的音乐。</p>
        </div>
      </div>
    </template>

    <template v-else-if="activeTab === 'playlist'">
      <div v-if="favoritePlaylists.length" class="grid playlist-grid">
        <PlaylistCard
          v-for="playlist in favoritePlaylists"
          :key="playlist.id"
          :playlist="playlist"
        />
      </div>
      <div v-else class="empty-state">
        <div>
          <strong>还没有收藏歌单</strong>
          <p>进入歌单详情页，点击“收藏歌单”即可。</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-if="historySongs.length" class="song-list">
        <SongRow
          v-for="(song, index) in historySongs"
          :key="song.id"
          :song="song"
          :index="index"
          :queue="historySongs"
        />
      </div>
      <div v-else class="empty-state">
        <div>
          <strong>还没有播放记录</strong>
          <p>开始播放歌曲后，这里会记录你的收听历史。</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: var(--shadow-soft);
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  flex: 0 0 auto;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--primary), #a56cff);
  color: #fff;
  font-size: 34px;
  font-weight: 800;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.user-card h1 {
  margin: 0;
  font-size: 30px;
}

.user-card p:last-child {
  margin: 8px 0 0;
  color: var(--muted);
}

.user-card .btn {
  margin-left: auto;
}

.tabs {
  display: flex;
  gap: 8px;
  margin: 28px 0 18px;
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
  margin-top: 18px;
}

@media (max-width: 640px) {
  .user-card {
    flex-wrap: wrap;
  }

  .user-card .btn {
    margin-left: 0;
  }
}
</style>
