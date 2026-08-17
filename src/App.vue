<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PlayerBar from './components/PlayerBar.vue'

const route = useRoute()
const showPlayer = computed(() => !['login', 'register'].includes(route.name))
</script>

<template>
  <div class="app-shell" :class="{ 'has-player': showPlayer }">
    <RouterView />
    <PlayerBar v-if="showPlayer" />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding-bottom: 0;
}

.app-shell.has-player {
  padding-bottom: var(--player-height);
}
</style>
