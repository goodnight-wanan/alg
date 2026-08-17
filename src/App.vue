<script setup>
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import PlayerBar from './components/PlayerBar.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="page">
      <RouterView />
    </main>
    <AppFooter />
    <PlayerBar />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding-bottom: var(--player-height);
}
</style>
