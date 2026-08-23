<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { openAuthWindow } from '../utils/openAuthWindow'
import { showNotice } from '../utils/notice'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const keyword = ref('')
const headerEl = ref(null)
let resizeObserver = null

const isHome = computed(() => route.path === '/')
const isCategory = computed(() => route.path.startsWith('/category'))
const isSearch = computed(() => route.path === '/search')
const isMine = computed(() => route.name === 'mine' || route.name === 'profile')

function submitSearch() {
  const value = keyword.value.trim()
  if (!value) return
  router.push({ name: 'search', query: { q: value } })
  keyword.value = ''
}

function updateHeaderHeight() {
  if (headerEl.value) {
    document.documentElement.style.setProperty('--header-height', `${headerEl.value.offsetHeight}px`)
  }
}

onMounted(() => {
  updateHeaderHeight()
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(updateHeaderHeight)
    if (headerEl.value) resizeObserver.observe(headerEl.value)
  }
  window.addEventListener('resize', updateHeaderHeight)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', updateHeaderHeight)
  document.documentElement.style.removeProperty('--header-height')
})
</script>

<template>
  <header ref="headerEl" class="app-header">
    <div class="app-header-top">
      <div class="app-header-logo" @click="router.push('/')">悦音音乐</div>
      <div class="app-header-column">
        <div class="app-header-col" :class="{ 'is-active': isHome }" @click="router.push('/')">音乐馆</div>
        <a
          v-if="!userStore.isLoggedIn"
          class="app-header-col"
          href="#/login"
          @click.prevent="openAuthWindow()"
        >我的音乐</a>
        <div v-else class="app-header-col" :class="{ 'is-active': isMine }" @click="router.push('/mine')">我的音乐</div>
        <div class="app-header-col" @click="showNotice('客户端为演示功能，暂未开放')">客户端</div>
        <div class="app-header-col" @click="showNotice('VIP 为演示功能，暂未开放')">VIP</div>
      </div>
      <form class="app-header-search" @submit.prevent="submitSearch">
        <input v-model="keyword" class="app-header-input" type="text" placeholder="搜索歌曲、歌单、歌手" />
        <button class="app-header-search-btn" type="submit" title="搜索">⌕</button>
      </form>
      <div class="app-header-login" title="账号登录">
        <RouterLink
          v-if="userStore.isLoggedIn"
          class="user-avatar"
          to="/profile"
          :title="userStore.currentUser.username"
        >
          {{ userStore.currentUser.username?.charAt(0).toUpperCase() || '?' }}
        </RouterLink>
        <a v-else class="app-header-login-link" href="#/login" @click.prevent="openAuthWindow()">登录</a>
      </div>
    </div>
    <div class="app-header-line"></div>
    <nav class="app-header-menu">
      <a href="javascript:;" @click.prevent="router.push('/')">
        <div class="app-header-menu-item" :class="{ 'is-active': isHome }">主页</div>
      </a>
      <a href="#" @click.prevent="showNotice('歌手功能暂未开放')"><div class="app-header-menu-item">歌手</div></a>
      <a href="#" @click.prevent="showNotice('新碟功能暂未开放')"><div class="app-header-menu-item">新碟</div></a>
      <a href="javascript:;" @click.prevent="router.push('/search?tab=song')">
        <div class="app-header-menu-item" :class="{ 'is-active': isSearch }">排行榜</div>
      </a>
      <a href="javascript:;" @click.prevent="router.push('/category')">
        <div class="app-header-menu-item" :class="{ 'is-active': isCategory }">分类歌单</div>
      </a>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgb(255 214 214 / 97%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 14px rgba(93, 54, 70, 0.08);
}

.app-header-top {
  width: min(1320px, calc(100% - 48px));
  height: 72px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.app-header-logo {
  flex: 0 0 auto;
  width: 200px;
  height: 56px;
  border: 1px solid black;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 1000;
  letter-spacing: 4px;
  cursor: pointer;
  user-select: none;
}

.app-header-column {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header-col {
  min-width: 86px;
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 34px;
  font-size: 16px;
  font-weight: 800;
  color: black;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 8px;
  text-decoration: none;
  transition: 0.15s;
  white-space: nowrap;
}

.app-header-col:hover {
  color: #e94e77;
  border-color: rgba(25, 25, 25, 0.18);
}

.app-header-col.is-active {
  color: #e94e77;
  border-color: rgba(255, 105, 157, 0.28);
}

.app-header-search {
  position: relative;
  width: 300px;
  height: 36px;
}

.app-header-input {
  width: 100%;
  height: 36px;
  padding-left: 14px;
  padding-right: 36px;
  outline: none;
  font-size: 14px;
  border-radius: 5px;
  border: 1px solid rgba(25, 25, 25, 0.12);
  background-color: rgba(255, 255, 255, 0.6);
}

.app-header-search-btn {
  position: absolute;
  top: 2px;
  right: 6px;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  color: #665d63;
}

.app-header-search-btn:hover {
  color: #e94e77;
}

.app-header-login {
  flex: 0 0 auto;
  height: 36px;
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  line-height: 36px;
}

.app-header-login-link {
  color: black;
  text-decoration: none;
  cursor: pointer;
  transition: 0.2s;
}

.app-header-login-link:hover {
  color: #e94e77;
}

.app-header-line {
  width: min(1320px, calc(100% - 48px));
  height: 2px;
  background-color: rgb(243, 243, 243);
  margin: 0 auto;
}

.app-header-menu {
  width: min(720px, calc(100% - 48px));
  height: 36px;
  margin: 12px auto 0;
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.app-header-menu a {
  color: black;
  text-decoration: none;
}

.app-header-menu-item {
  font-size: 16px;
  font-weight: 1000;
  line-height: 36px;
  cursor: pointer;
  transition: 0.1s;
}

.app-header-menu-item:hover {
  color: #e94e77;
}

.app-header-menu-item.is-active {
  color: #e94e77;
}

@media (max-width: 1100px) {
  .app-header-top {
    padding: 0 12px;
  }

  .app-header-search {
    width: min(350px, 28vw);
  }
}

@media (max-width: 900px) {
  .app-header-top {
    height: auto;
    flex-wrap: wrap;
    padding: 8px 0;
  }

  .app-header-search {
    width: 100%;
    margin-top: 8px;
  }
}

@media (max-width: 700px) {
  .app-header-top {
    flex-wrap: wrap;
    padding: 0;
  }

  .app-header-logo {
    width: 100%;
    height: 58px;
  }

  .app-header-column {
    width: 100%;
    flex-wrap: wrap;
    gap: 4px;
  }

  .app-header-col {
    flex: 1 1 auto;
    height: 48px;
    line-height: 48px;
    font-size: 16px;
  }

  .app-header-search {
    width: 100%;
    height: 42px;
    margin: 12px 0 0;
  }

  .app-header-input {
    height: 42px;
    width: 100%;
  }

  .app-header-search-btn {
    top: 1px;
    right: 6px;
    height: 40px;
  }

  .app-header-login {
    height: auto;
    margin: 10px 0 0;
    font-size: 18px;
  }

  .app-header-line {
    width: 100%;
  }

  .app-header-menu {
    width: 100%;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .app-header-menu-item {
    line-height: 38px;
  }
}
</style>