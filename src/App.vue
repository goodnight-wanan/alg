<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PlayerBar from './components/PlayerBar.vue'
import AppHeader from './components/AppHeader.vue'
import { useUserStore } from './stores/user'
import { useNotice } from './utils/notice'

const route = useRoute()
const userStore = useUserStore()
const notice = useNotice()
const showPlayer = computed(() => !['login', 'register'].includes(route.name))
const showHeader = computed(() => !['login', 'register'].includes(route.name))
const showBackTop = ref(false)

function handleScroll() {
  showBackTop.value = window.scrollY > 420
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleStorage(event) {
  if (event.key === 'music-site:session') {
    userStore.syncSession()
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('storage', handleStorage)
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('storage', handleStorage)
})
</script>

<template>
  <div class="app-shell" :class="{ 'has-player': showPlayer }">
    <AppHeader v-if="showHeader" />
    <RouterView />
    <PlayerBar v-if="showPlayer" />

    <Transition name="notice">
      <div v-if="notice" class="page-notice">{{ notice }}</div>
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
      ↑
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
.page-notice {
  position: fixed;
  top: calc(var(--header-height, 0px) + 18px);
  left: 50%;
  z-index: 2000;
  padding: 12px 22px;
  border-radius: 999px;
  background: rgb(25 25 25 / 88%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
  transform: translateX(-50%);
}

.notice-enter-active,
.notice-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
