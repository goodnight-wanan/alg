<script setup>
import PlayerBar from './components/PlayerBar.vue'
</script>

<template>
  <div class="app-shell">
    <RouterView />
    <PlayerBar />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding-bottom: 88px;
}
</style>
