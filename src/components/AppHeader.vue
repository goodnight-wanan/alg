<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const keyword = ref('')

function submitSearch() {
  const value = keyword.value.trim()
  if (!value) return
  router.push({ name: 'search', query: { q: value } })
  keyword.value = ''
}
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <RouterLink to="/" class="logo" aria-label="悦音音乐首页">
        <span class="logo-mark">♪</span>
        <span>悦音音乐</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/" exact-active-class="active">首页</RouterLink>
        <RouterLink to="/category" active-class="active">分类歌单</RouterLink>
        <RouterLink to="/mine" active-class="active">我的音乐</RouterLink>
      </nav>

      <form class="header-search" @submit.prevent="submitSearch">
        <input
          v-model="keyword"
          type="search"
          placeholder="搜索歌曲、歌单、歌手"
          aria-label="搜索歌曲、歌单、歌手"
        />
        <button type="submit" aria-label="搜索">⌕</button>
      </form>

      <div class="header-actions">
        <template v-if="userStore.isLoggedIn">
          <RouterLink to="/mine" class="user-chip">
            <span class="avatar">{{ userStore.currentUser.username.slice(0, 1) }}</span>
            <span>{{ userStore.currentUser.username }}</span>
          </RouterLink>
          <button class="logout" type="button" @click="userStore.logout">退出</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="header-login">登录</RouterLink>
          <RouterLink to="/register" class="header-register">注册</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  height: var(--header-height);
  border-bottom: 1px solid rgba(230, 226, 238, 0.78);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
}

.header-inner {
  width: min(1240px, calc(100% - 48px));
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 30px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.logo-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), #ff8eab);
  color: #fff;
  font-size: 22px;
  line-height: 1;
}

.nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav a {
  position: relative;
  padding: 10px 0;
  color: var(--muted);
  font-size: 15px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.nav a:hover,
.nav a.active {
  color: var(--primary);
}

.header-search {
  position: relative;
  width: min(320px, 30vw);
  margin-left: auto;
}

.header-search input {
  width: 100%;
  height: 42px;
  padding: 0 42px 0 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text);
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.header-search input:focus {
  border-color: var(--primary);
  background: #fff;
}

.header-search button {
  position: absolute;
  top: 50%;
  right: 7px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  transform: translateY(-50%);
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  font-size: 22px;
}

.header-search button:hover {
  color: var(--primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.header-login,
.header-register,
.logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
}

.header-login {
  color: var(--text);
}

.header-register {
  background: var(--primary);
  color: #fff;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 150px;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.user-chip span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary-strong);
}

.logout {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--muted);
}

@media (max-width: 900px) {
  .header-inner {
    gap: 14px;
  }

  .nav {
    gap: 12px;
  }

  .header-search {
    width: 180px;
    margin-left: auto;
  }

  .header-actions {
    gap: 6px;
  }
}

@media (max-width: 640px) {
  .header-inner {
    width: calc(100% - 28px);
  }

  .logo span:last-child,
  .nav,
  .logout {
    display: none;
  }

  .header-search {
    width: min(52vw, 260px);
  }

  .header-login {
    padding: 0 8px;
  }

  .user-chip span:last-child {
    display: none;
  }
}
</style>
