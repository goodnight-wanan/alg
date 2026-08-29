<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from './admin/auth'
import { useAdminStatsStore } from './admin/stats'

const auth = useAdminAuthStore()
const statsStore = useAdminStatsStore()
const router = useRouter()

const summaryItems = computed(() => {
  const stats = statsStore.stats
  if (!stats) return []
  return [
    { label: '歌曲', value: stats.songs.total },
    { label: '已上架', value: stats.songs.published },
    { label: '歌手', value: stats.artists },
    { label: '专辑', value: stats.albums },
    { label: '分类', value: stats.categories },
    { label: '总播放', value: stats.totalPlays }
  ]
})

async function logout() {
  await auth.logout()
  await router.replace({ name: 'login' })
}

onMounted(() => {
  void statsStore.refresh()
})

watch(
  () => auth.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) void statsStore.refresh()
  }
)
</script>

<template>
  <div class="admin-shell">
    <header v-if="auth.isAuthenticated" class="admin-header">
      <div class="header-title">
        <span class="eyebrow">YUEYIN CONSOLE</span>
        <h1>悦音音乐管理后台</h1>
      </div>
      <nav class="admin-summary" aria-label="数据汇总">
        <span v-for="item in summaryItems" :key="item.label" class="summary-item">
          <strong>{{ item.value }}</strong>
          <small>{{ item.label }}</small>
        </span>
      </nav>
      <div class="header-actions">
        <span>{{ auth.session.user.username }}</span>
        <button class="secondary-button" type="button" @click="logout">退出</button>
      </div>
    </header>
    <RouterView />
  </div>
</template>

<style scoped>
.header-title {
  flex: 0 0 auto;
}

.admin-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 2vw, 22px);
  margin: 0 auto;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
  gap: 2px;
}

.summary-item strong {
  font-size: 18px;
  font-weight: 900;
  color: #352b32;
}

.summary-item small {
  font-size: 11px;
  font-weight: 700;
  color: #8a7f86;
  letter-spacing: 1px;
}

@media (max-width: 860px) {
  .admin-header {
    flex-wrap: wrap;
  }

  .admin-summary {
    order: 3;
    flex-basis: 100%;
    justify-content: flex-start;
  }
}
</style>
