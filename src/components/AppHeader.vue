<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArtists, playlists, songs } from '../data/catalogData'
import { useUserStore } from '../stores/user'
import { openAuthWindow } from '../utils/authWindow'
import { showNotice } from '../utils/notice'
import { addSearchHistory, useSearchHistory } from '../utils/searchHistory'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const keyword = ref('')
const headerEl = ref(null)
const searchInput = ref(null)
const menuOpen = ref(false)
const searchFocused = ref(false)
const searchHistory = useSearchHistory()
let resizeObserver = null

const isHome = computed(() => route.path === '/')
const isCategory = computed(() => route.path.startsWith('/category'))
const isRank = computed(() => route.path === '/rank')
const isAlbum = computed(() => route.path === '/album')
const isArtist = computed(() => route.path === '/artist')
const isMine = computed(() => route.name === 'mine')
const searchSuggestions = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  if (!word) return []

  const songItems = songs
    .filter((song) => [song.title, song.artist, song.album].join(' ').toLowerCase().includes(word))
    .slice(0, 4)
    .map((song) => ({
      type: '歌曲',
      title: song.title,
      subtitle: song.artist,
      query: song.title,
      cover: song.cover
    }))
  const playlistItems = playlists
    .filter((playlist) =>
      [playlist.title, playlist.description].join(' ').toLowerCase().includes(word)
    )
    .slice(0, 2)
    .map((playlist) => ({
      type: '歌单',
      title: playlist.title,
      subtitle: playlist.description,
      query: playlist.title,
      cover: playlist.cover
    }))
  const artistItems = getArtists()
    .filter((artist) => artist.name.toLowerCase().includes(word))
    .slice(0, 2)
    .map((artist) => ({
      type: '歌手',
      title: artist.name,
      subtitle: `${artist.region} · ${artist.songCount} 首`,
      query: artist.name,
      cover: artist.cover
    }))

  return [...songItems, ...playlistItems, ...artistItems].slice(0, 8)
})
const showSearchPanel = computed(() => searchFocused.value)

function submitSearch() {
  const value = keyword.value.trim()
  if (!value) return
  addSearchHistory(value)
  router.push({ name: 'search', query: { q: value } })
  keyword.value = ''
  searchFocused.value = false
}

function chooseSearch(value) {
  keyword.value = value
  addSearchHistory(value)
  router.push({ name: 'search', query: { q: value } })
  keyword.value = ''
  searchFocused.value = false
}

function handleSearchFocus() {
  searchFocused.value = true
}

function handleSearchBlur() {
  window.setTimeout(() => {
    searchFocused.value = false
  }, 140)
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
  openAuthWindow(router, 'login', redirect)
}

function handleGlobalKey(event) {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  event.preventDefault()
  if (window.innerWidth <= 900) {
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
  searchInput.value?.addEventListener('focus', handleSearchFocus)
  searchInput.value?.addEventListener('blur', handleSearchBlur)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', updateHeaderHeight)
  window.removeEventListener('keydown', handleGlobalKey)
  searchInput.value?.removeEventListener('focus', handleSearchFocus)
  searchInput.value?.removeEventListener('blur', handleSearchBlur)
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
        <Transition name="search-panel">
          <div v-if="showSearchPanel" class="header-search-panel">
            <template v-if="keyword.trim()">
              <div class="header-search-panel-title">搜索建议</div>
              <button
                v-for="item in searchSuggestions"
                :key="`${item.type}-${item.title}`"
                type="button"
                class="header-search-suggestion"
                @mousedown.prevent="chooseSearch(item.query)"
              >
                <img :src="item.cover" :alt="item.title" />
                <span
                  ><strong>{{ item.title }}</strong
                  ><small>{{ item.subtitle }}</small></span
                >
                <em>{{ item.type }}</em>
              </button>
              <button
                v-if="!searchSuggestions.length"
                type="button"
                class="header-search-empty"
                @mousedown.prevent="chooseSearch(keyword)"
              >
                搜索“{{ keyword }}”
              </button>
            </template>
            <template v-else>
              <div class="header-search-panel-title">最近搜索</div>
              <button
                v-for="item in searchHistory"
                :key="item"
                type="button"
                class="header-search-history"
                @mousedown.prevent="chooseSearch(item)"
              >
                <Icon name="clock" :size="15" />
                <span>{{ item }}</span>
              </button>
              <div v-if="!searchHistory.length" class="header-search-empty">暂无最近搜索</div>
            </template>
          </div>
        </Transition>
      </form>

      <div class="app-header-login">
        <RouterLink
          v-if="userStore.isLoggedIn"
          class="user-avatar"
          :to="{ name: 'profile' }"
          title="进入个人中心"
          aria-label="进入个人中心"
        >
          <img :src="userStore.currentUser.avatarUrl" alt="用户头像" />
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

.header-search-panel {
  position: absolute;
  top: 44px;
  left: 0;
  z-index: 130;
  width: 100%;
  max-height: 420px;
  overflow: auto;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  background: rgba(255, 250, 252, 0.98);
  box-shadow: 0 18px 40px rgba(93, 54, 70, 0.2);
}

.header-search-panel-title {
  padding: 7px 9px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 800;
}

.header-search-suggestion,
.header-search-history,
.header-search-empty {
  width: 100%;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  text-align: left;
}

.header-search-suggestion {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  padding: 7px;
}

.header-search-suggestion:hover,
.header-search-history:hover {
  background: rgba(255, 126, 179, 0.12);
}

.header-search-suggestion img {
  width: 38px;
  height: 38px;
  border-radius: 7px;
  object-fit: cover;
}

.header-search-suggestion span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.header-search-suggestion strong,
.header-search-suggestion small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-search-suggestion small,
.header-search-suggestion em {
  color: var(--text-secondary);
  font-size: 11px;
  font-style: normal;
}

.header-search-history {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px;
}

.header-search-empty {
  display: block;
  padding: 14px 9px;
  color: var(--text-secondary);
  font-size: 13px;
}

.search-panel-enter-active,
.search-panel-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.search-panel-enter-from,
.search-panel-leave-to {
  opacity: 0;
  transform: translateY(-5px);
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

@media (max-width: 900px) {
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

  .app-header.menu-open .app-header-top {
    height: auto;
    flex-wrap: wrap;
    padding-bottom: 12px;
  }

  .app-header.menu-open .app-header-search {
    order: 4;
    width: 100%;
    height: 42px;
    margin: 10px 0 0;
  }

  .app-header.menu-open .app-header-input {
    height: 42px;
  }

  .app-header.menu-open .app-header-column {
    order: 5;
    width: 100%;
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
