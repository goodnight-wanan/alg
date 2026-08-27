<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { showNotice } from '../utils/notice'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const keyword = ref('')
const headerEl = ref(null)
const searchInput = ref(null)
const menuOpen = ref(false)
let resizeObserver = null

const isHome = computed(() => route.path === '/')
const isCategory = computed(() => route.path.startsWith('/category'))
const isRank = computed(() => route.path === '/rank')
const isAlbum = computed(() => route.path === '/album')
const isArtist = computed(() => route.path === '/artist')
const isMine = computed(() => route.name === 'mine' || route.name === 'profile')

function submitSearch() {
  const value = keyword.value.trim()
  if (!value) return
  router.push({ name: 'search', query: { q: value } })
  keyword.value = ''
}

function updateHeaderHeight() {
  if (headerEl.value) {
    document.documentElement.style.setProperty(
      '--header-height',
      `${headerEl.value.offsetHeight}px`
    )
  }
}

function goLogin(redirect = route.fullPath) {
  router.push({ name: 'login', query: { redirect } })
}

function handleGlobalKey(event) {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  event.preventDefault()
  if (window.innerWidth <= 700) {
    menuOpen.value = true
  }
  nextTick(() => searchInput.value?.focus())
}

watch(
  () => route.path,
  () => {
    menuOpen.value = false
  }
)

onMounted(() => {
  updateHeaderHeight()
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(updateHeaderHeight)
    if (headerEl.value) resizeObserver.observe(headerEl.value)
  }
  window.addEventListener('resize', updateHeaderHeight)
  window.addEventListener('keydown', handleGlobalKey)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', updateHeaderHeight)
  window.removeEventListener('keydown', handleGlobalKey)
  document.documentElement.style.removeProperty('--header-height')
})
</script>

<template>
  <header ref="headerEl" class="app-header" :class="{ 'menu-open': menuOpen }">
    <div class="app-header-top">
      <RouterLink to="/" class="app-header-logo">
        <span class="app-header-logo-mark"><Icon name="music-note" :size="20" /></span>
        <span class="app-header-logo-text">悦音音乐</span>
      </RouterLink>

      <nav class="app-header-column" aria-label="主导航">
        <RouterLink
          to="/"
          class="app-header-col"
          :class="{ 'is-active': isHome }"
          :aria-current="isHome ? 'page' : undefined"
          >音乐馆</RouterLink
        >
        <button
          v-if="!userStore.isLoggedIn"
          type="button"
          class="app-header-col"
          @click="goLogin('/mine')"
        >
          我的音乐
        </button>
        <RouterLink
          v-else
          to="/mine"
          class="app-header-col"
          :class="{ 'is-active': isMine }"
          :aria-current="isMine ? 'page' : undefined"
          >我的音乐</RouterLink
        >
        <button
          type="button"
          class="app-header-col"
          @click="showNotice('客户端为演示功能，暂未开放')"
        >
          客户端
        </button>
        <button
          type="button"
          class="app-header-col"
          @click="showNotice('VIP 为演示功能，暂未开放')"
        >
          VIP
        </button>
      </nav>

      <form class="app-header-search" role="search" @submit.prevent="submitSearch">
        <input
          ref="searchInput"
          v-model="keyword"
          class="app-header-input"
          type="search"
          placeholder="搜索歌曲、歌单、歌手"
          aria-label="搜索"
        />
        <button class="app-header-search-btn" type="submit" title="搜索" aria-label="搜索">
          <Icon name="search" :size="18" />
        </button>
      </form>

      <div class="app-header-login">
        <RouterLink
          v-if="userStore.isLoggedIn"
          class="user-avatar"
          to="/profile"
          :title="userStore.currentUser.username"
        >
          {{ userStore.currentUser.username?.charAt(0).toUpperCase() || '?' }}
        </RouterLink>
        <button v-else type="button" class="app-header-login-link" @click="goLogin()">登录</button>
      </div>

      <button
        type="button"
        class="app-header-burger"
        :aria-expanded="menuOpen"
        aria-label="菜单"
        @click="menuOpen = !menuOpen"
      >
        <Icon :name="menuOpen ? 'close' : 'menu'" :size="22" />
      </button>
    </div>

    <div class="app-header-line"></div>

    <nav class="app-header-menu" aria-label="分类导航">
      <RouterLink
        to="/"
        class="app-header-menu-item"
        :class="{ 'is-active': isHome }"
        :aria-current="isHome ? 'page' : undefined"
        >首页</RouterLink
      >
      <RouterLink
        to="/artist"
        class="app-header-menu-item"
        :class="{ 'is-active': isArtist }"
        :aria-current="isArtist ? 'page' : undefined"
        >歌手</RouterLink
      >
      <RouterLink
        to="/album"
        class="app-header-menu-item"
        :class="{ 'is-active': isAlbum }"
        :aria-current="isAlbum ? 'page' : undefined"
        >新碟</RouterLink
      >
      <RouterLink
        to="/rank"
        class="app-header-menu-item"
        :class="{ 'is-active': isRank }"
        :aria-current="isRank ? 'page' : undefined"
        >排行榜</RouterLink
      >
      <RouterLink
        to="/category"
        class="app-header-menu-item"
        :class="{ 'is-active': isCategory }"
        :aria-current="isCategory ? 'page' : undefined"
        >分类歌单</RouterLink
      >
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
  background: rgb(255 214 214 / 82%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
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
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
}

.app-header-logo-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--brand-soft), var(--brand-strong));
  color: #fff;
  box-shadow: 0 6px 14px rgba(233, 78, 119, 0.28);
}

.app-header-logo-text {
  color: var(--text);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 2px;
}

.app-header-column {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header-col {
  position: relative;
  min-width: 86px;
  height: 36px;
  margin: 0;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 34px;
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  text-align: center;
  text-decoration: none;
  appearance: none;
  -webkit-appearance: none;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
  white-space: nowrap;
}

.app-header-col:hover {
  color: var(--brand-strong);
  border-color: rgba(25, 25, 25, 0.18);
}

.app-header-col.is-active {
  color: var(--brand-strong);
}

.app-header-col.is-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 16px;
  height: 3px;
  border-radius: 999px;
  background: var(--brand-strong);
  transform: translateX(-50%);
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
  border-radius: 8px;
  border: 1px solid rgba(25, 25, 25, 0.12);
  background-color: rgba(255, 255, 255, 0.6);
}

.app-header-search-btn {
  position: absolute;
  top: 2px;
  right: 6px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.app-header-search-btn:hover {
  color: var(--brand-strong);
}

.app-header-login {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header-login-link {
  display: inline-block;
  padding: 7px 16px;
  border: 1px solid var(--brand);
  border-radius: 999px;
  background: transparent;
  color: var(--brand-strong);
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.app-header-login-link:hover {
  background: var(--brand);
  color: #fff;
}

.app-header-burger {
  display: none;
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

.app-header-menu-item {
  position: relative;
  margin: 0;
  padding: 0;
  font-size: 16px;
  font-weight: 900;
  line-height: 36px;
  color: var(--text);
  cursor: pointer;
  background: transparent;
  border: 0;
  font-family: inherit;
  text-align: center;
  text-decoration: none;
  appearance: none;
  -webkit-appearance: none;
  transition: color 0.15s ease;
}

.app-header-menu-item:hover {
  color: var(--brand-strong);
}

.app-header-menu-item.is-active {
  color: var(--brand-strong);
}

.app-header-menu-item.is-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: var(--brand-strong);
  transform: translateX(-50%);
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
    height: 60px;
    flex-wrap: nowrap;
    gap: 10px;
    padding: 0 12px;
  }

  .app-header-logo {
    height: 48px;
    gap: 8px;
  }

  .app-header-logo-mark {
    width: 34px;
    height: 34px;
    border-radius: 9px;
  }

  .app-header-logo-text {
    font-size: 19px;
    letter-spacing: 1px;
  }

  .app-header-login {
    margin-left: auto;
  }

  .app-header-burger {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }

  .app-header-search,
  .app-header-column,
  .app-header-line,
  .app-header-menu {
    display: none;
  }

  .app-header.menu-open .app-header-search,
  .app-header.menu-open .app-header-column,
  .app-header.menu-open .app-header-line,
  .app-header.menu-open .app-header-menu {
    display: flex;
  }

  .app-header.menu-open .app-header-search {
    width: 100%;
    height: 42px;
    margin: 10px 0 0;
  }

  .app-header.menu-open .app-header-input {
    height: 42px;
  }

  .app-header.menu-open .app-header-column {
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 10px;
  }

  .app-header.menu-open .app-header-col {
    flex: 1 1 auto;
    height: 44px;
    line-height: 44px;
    font-size: 15px;
  }

  .app-header.menu-open .app-header-menu {
    flex-wrap: wrap;
    margin-top: 8px;
    padding-bottom: 10px;
  }

  .app-header.menu-open .app-header-menu-item {
    line-height: 38px;
  }
}
</style>
