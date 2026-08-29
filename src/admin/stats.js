import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAdminAuthStore } from './auth'

export const useAdminStatsStore = defineStore('admin-stats', () => {
  const auth = useAdminAuthStore()
  const stats = ref(null)
  const loading = ref(false)
  const error = ref('')

  async function refresh() {
    if (!auth.isAuthenticated) return
    loading.value = true
    error.value = ''
    try {
      stats.value = await auth.request('/admin/stats')
    } catch (requestError) {
      error.value = requestError?.message || '统计数据加载失败'
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, error, refresh }
})
