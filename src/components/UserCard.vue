<script setup>
import { computed } from 'vue'
import { useUserStore } from '../stores/user'
import { getSongById } from '../data/catalogData'

defineProps({
  showStats: { type: Boolean, default: false }
})

const userStore = useUserStore()

const avatarUrl = computed(() => userStore.currentUser?.avatarUrl)

const listeningSeconds = computed(() =>
  userStore.playHistory.reduce((sum, item) => {
    const song = getSongById(item.id)
    return sum + (song?.durationSeconds || 0) * (item.playCount || 1)
  }, 0)
)

function formatListening(seconds) {
  if (!seconds) return '0 分钟'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟`
  return `${(minutes / 60).toFixed(1)} 小时`
}

const stats = computed(() => [
  { label: '收藏歌曲', value: userStore.favoriteSongs.length },
  { label: '收藏歌单', value: userStore.favoritePlaylists.length },
  { label: '最近播放', value: userStore.playHistory.length },
  { label: '听歌时长', value: formatListening(listeningSeconds.value) }
])

</script>

<template>
  <div class="user-card">
    <div class="user-card-avatar">
      <img :src="avatarUrl" alt="用户头像" />
    </div>
    <div class="user-card-main">
      <div class="user-card-name">
        {{ userStore.currentUser?.nickname || userStore.currentUser?.username || '' }}
      </div>
      <div class="user-card-email">{{ userStore.currentUser?.email || '' }}</div>
      <div v-if="showStats" class="user-card-stats">
        <span v-for="item in stats" :key="item.label">
          {{ item.label }} <b>{{ item.value }}</b>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 24px;
  padding: 20px 22px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 10px 24px rgba(93, 54, 70, 0.08);
}

.user-card-avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.55);
}

.user-card-avatar img { width: 100%; height: 100%; object-fit: cover; }

.user-card-main {
  min-width: 0;
  flex: 1;
}

.user-card-name {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 1px;
}

.user-card-email {
  margin-top: 2px;
  color: var(--text-secondary);
  font-size: 13px;
}

.user-card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.user-card-stats b {
  color: var(--brand-strong);
  font-weight: 900;
}

@media (max-width: 700px) {
  .user-card {
    flex-wrap: wrap;
  }

  .user-card-main {
    flex: 1 1 auto;
  }
}
</style>
