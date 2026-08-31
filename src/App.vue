<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlayerBar from './components/PlayerBar.vue'
import AppHeader from './components/AppHeader.vue'
import { useCatalogStore } from './stores/catalog'
import { useUserStore } from './stores/user'
import { showNotice, useNotice } from './utils/notice'
import { AUTH_EXPIRED_EVENT } from './api/client'
import Lenis from 'lenis'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const catalogStore = useCatalogStore()
const notice = useNotice()
const noticeIcon = computed(() => {
  const type = notice.value?.type
  if (type === 'success') return 'success'
  if (type === 'error') return 'alert'
  return 'info'
})
const showPlayer = computed(() => !['login', 'register'].includes(route.name))
const showHeader = computed(() => !['login', 'register'].includes(route.name))
const needsCatalog = computed(() => !['login', 'register', 'profile'].includes(route.name))
const showBackTop = ref(false)
let lenis = null

function handleScroll() {
  showBackTop.value = window.scrollY > 420
}

function scrollToTop() {
  if (lenis) {
    lenis.scrollTo(0)
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function handleStorage(event) {
  if (event.key === 'music-site:auth-session') {
    void userStore.syncSession()
  }
}

async function handleAuthMessage(event) {
  if (event.origin !== window.location.origin || event.data?.type !== 'music-site:auth-success')
    return
  await userStore.syncSession()
  showNotice('登录成功', 'success')
  const redirect = String(event.data.redirect || '/')
  if (redirect.startsWith('/') && !redirect.startsWith('//')) router.push(redirect)
}

function handleAuthExpired() {
  showNotice('登录状态已过期，请重新登录', 'error')
  if (route.meta.requiresAuth) {
    router.replace({ name: 'login', query: { redirect: route.fullPath } })
  }
}

onMounted(() => {
  lenis = new Lenis({ autoRaf: true })
  void userStore.initialize()
  void catalogStore.loadCatalog()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('storage', handleStorage)
  window.addEventListener('message', handleAuthMessage)
  window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
  handleScroll()
})

onBeforeUnmount(() => {
  lenis?.destroy()
  lenis = null
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('storage', handleStorage)
  window.removeEventListener('message', handleAuthMessage)
  window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
})
</script>

<template>
  <div class="app-shell" :class="{ 'has-player': showPlayer }">
    <AppHeader v-if="showHeader" />
    <main
      v-if="needsCatalog && catalogStore.loading && !catalogStore.hasData"
      class="catalog-state"
      aria-live="polite"
    >
      <span class="catalog-state-spinner" aria-hidden="true"></span>
      <h1>正在加载悦音曲库</h1>
      <p>正在连接后端并准备歌曲、歌单与歌手数据…</p>
    </main>
    <main
      v-else-if="needsCatalog && catalogStore.error && !catalogStore.hasData"
      class="catalog-state is-error"
      role="alert"
    >
      <Icon name="alert" :size="28" />
      <h1>曲库暂时无法加载</h1>
      <p>{{ catalogStore.error }}</p>
      <button type="button" @click="catalogStore.retry">重新加载</button>
    </main>
    <main
      v-else-if="needsCatalog && catalogStore.initialized && !catalogStore.hasData"
      class="catalog-state"
      aria-live="polite"
    >
      <Icon name="music-note" :size="30" />
      <h1>曲库暂时为空</h1>
      <p>还没有已上架歌曲，请稍后再来看看。</p>
      <button type="button" @click="catalogStore.retry">重新检查</button>
    </main>
    <RouterView v-else />
    <PlayerBar v-if="showPlayer" />

    <Transition name="notice">
      <div v-if="notice" class="page-notice" :class="`is-${notice.type}`">
        <Icon :name="noticeIcon" :size="16" />
        <span>{{ notice.message }}</span>
      </div>
    </Transition>

    <button
      v-show="showBackTop"
      class="back-top-button"
      :class="{ 'is-auth': !showPlayer }"
      type="button"
      title="返回顶部"
      aria-label="返回顶部"
      @click="scrollToTop"
    >
      <Icon name="chevron-up" :size="26" />
    </button>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding-top: var(--header-height, 0px);
  padding-bottom: 0;
}

.app-shell.has-player {
  padding-bottom: 0;
}

.catalog-state {
  display: grid;
  justify-items: center;
  gap: 12px;
  width: min(680px, calc(100% - 32px));
  margin: 72px auto;
  padding: 52px 28px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.68);
  color: var(--text);
  text-align: center;
  box-shadow: 0 20px 46px rgba(93, 54, 70, 0.12);
  backdrop-filter: blur(18px);
}

.catalog-state h1,
.catalog-state p {
  margin: 0;
}

.catalog-state p {
  color: var(--text-secondary);
}

.catalog-state button {
  margin-top: 8px;
  padding: 11px 24px;
  border: 0;
  border-radius: 999px;
  background: var(--brand-strong);
  color: #fff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.catalog-state-spinner {
  width: 34px;
  height: 34px;
  border: 4px solid rgba(233, 78, 119, 0.18);
  border-top-color: var(--brand-strong);
  border-radius: 50%;
  animation: catalog-spin 0.85s linear infinite;
}

@keyframes catalog-spin {
  to {
    transform: rotate(360deg);
  }
}

.back-top-button {
  position: fixed;
  right: 22px;
  bottom: calc(var(--player-height) + 18px);
  z-index: 1000;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  background: rgb(255 214 214 / 92%);
  color: var(--brand-strong-hover);
  font-size: 24px;
  font-weight: 900;
  box-shadow: 0 10px 24px rgba(93, 54, 70, 0.18);
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.back-top-button.is-auth {
  bottom: 22px;
}

.back-top-button:hover {
  transform: translateY(-3px);
  background: rgb(255 187 187 / 96%);
}
.page-notice {
  position: fixed;
  top: calc(var(--header-height, 0px) + 18px);
  left: 50%;
  z-index: 4000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 999px;
  background: rgb(25 25 25 / 88%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
  transform: translateX(-50%);
}

.page-notice.is-success {
  background: rgba(46, 160, 67, 0.92);
}

.page-notice.is-error {
  background: rgba(220, 53, 69, 0.92);
}

.notice-enter-active,
.notice-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
