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
        <nav class="admin-nav" aria-label="后台导航">
          <RouterLink to="/" exact-active-class="active">曲库管理</RouterLink>
          <RouterLink to="/users" active-class="active">用户管理</RouterLink>
        </nav>
        <span>{{ auth.session.user.username }}</span>
        <button class="secondary-button" type="button" @click="logout">退出</button>
      </div>
    </header>
    <RouterView />
  </div>
</template>
