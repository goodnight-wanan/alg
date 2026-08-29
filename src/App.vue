<script setup>
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from './admin/auth'

const auth = useAdminAuthStore()
const router = useRouter()

async function logout() {
  await auth.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <div class="admin-shell">
    <header v-if="auth.isAuthenticated" class="admin-header">
      <div>
        <span class="eyebrow">YUEYIN CONSOLE</span>
        <h1>悦音音乐管理后台</h1>
      </div>
      <div class="header-actions">
        <span>{{ auth.session.user.username }}</span>
        <button class="secondary-button" type="button" @click="logout">退出</button>
      </div>
    </header>
    <RouterView />
  </div>
</template>
