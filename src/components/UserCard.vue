<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

defineProps({
  showStats: { type: Boolean, default: false }
})

const router = useRouter()
const userStore = useUserStore()

const initial = computed(() =>
  userStore.currentUser?.username?.charAt(0).toUpperCase() || '?'
)

const stats = computed(() => [
  { label: '收藏歌曲', value: userStore.favoriteSongs.length },
  { label: '收藏歌单', value: userStore.favoritePlaylists.length },
  { label: '最近播放', value: userStore.playHistory.length }
])

function logout() {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="user-card">
    <div class="user-card-avatar">{{ initial }}</div>
    <div class="user-card-main">
      <div class="user-card-name">{{ userStore.currentUser?.username || '' }}</div>
      <div class="user-card-email">{{ userStore.currentUser?.email || '' }}</div>
      <div v-if="showStats" class="user-card-stats">
        <span v-for="item in stats" :key="item.label">
          {{ item.label }} <b>{{ item.value }}</b>
        </span>
      </div>
    </div>
    <button type="button" class="user-card-logout" @click="logout">退出登录</button>
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
  background: rgba(255, 255, 255, 0.5);
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
  background: rgba(255, 255, 255, 0.55);
  color: #e94e77;
  font-size: 28px;
  font-weight: 1000;
}

.user-card-main {
  min-width: 0;
  flex: 1;
}

.user-card-name {
  font-size: 20px;
  font-weight: 1000;
  letter-spacing: 1px;
}

.user-card-email {
  margin-top: 2px;
  color: #665d63;
  font-size: 13px;
}

.user-card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 10px;
  color: #665d63;
  font-size: 13px;
  font-weight: 700;
}

.user-card-stats b {
  color: #e94e77;
  font-weight: 1000;
}

.user-card-logout {
  flex: 0 0 auto;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: #665d63;
  font-weight: 700;
  cursor: pointer;
}

.user-card-logout:hover {
  color: #e94e77;
}

@media (max-width: 700px) {
  .user-card {
    flex-wrap: wrap;
  }

  .user-card-main {
    flex: 1 1 auto;
  }

  .user-card-logout {
    width: 100%;
  }
}
</style>