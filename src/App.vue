<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlayerBar from './components/PlayerBar.vue'
import SiteNav from './components/SiteNav.vue'
import { useUserStore } from './stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const showPlayer = computed(() => !['login', 'register'].includes(route.name))
const showSiteNav = computed(() => !['login', 'register', 'home'].includes(route.name))
const showBackTop = ref(false)

function handleScroll() {
  showBackTop.value = window.scrollY > 420
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleAuthMessage(event) {
  if (event.origin !== window.location.origin) return
  if (event.data?.type !== 'auth-success') return

  const redirect =
    typeof event.data.redirect === 'string' && event.data.redirect.startsWith('/')
      ? event.data.redirect
      : '/'

  userStore.syncSession()
  router.push(redirect)
}

function handleStorage(event) {
  if (event.key === 'music-site:session') {
    userStore.syncSession()
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('message', handleAuthMessage)
  window.addEventListener('storage', handleStorage)
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('message', handleAuthMessage)
  window.removeEventListener('storage', handleStorage)
})
</script>

<template>
  <div class="app-shell" :class="{ 'has-player': showPlayer }">
    <SiteNav v-if="showSiteNav" />
    <RouterView />
    <PlayerBar v-if="showPlayer" />

    <button
      v-show="showBackTop"
      class="back-top-button"
      :class="{ 'is-auth': !showPlayer }"
      type="button"
      title="返回顶部"
      aria-label="返回顶部"
      @click="scrollToTop"
    >
      ↑
    </button>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding-bottom: 0;
}

.app-shell.has-player {
  padding-bottom: 0;
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
  color: #d84a72;
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
</style>
