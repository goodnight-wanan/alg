<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { openAuthWindow } from '../utils/authWindow'
import { showNotice } from '../utils/notice'

const props = defineProps({
  song: { type: Object, required: true },
  compact: { type: Boolean, default: false }
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isFavorite = computed(() => userStore.isFavoriteSong(props.song.id))

async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    showNotice('请先登录后再收藏')
    openAuthWindow(router, 'login', route.fullPath)
    return
  }

  const result = await userStore.toggleFavoriteSong(props.song.id)
  if (!result.ok) {
    showNotice(result.message, 'error')
    return
  }
  showNotice(
    result.added ? `已收藏《${props.song.title}》` : `已取消收藏《${props.song.title}》`,
    result.added ? 'success' : 'info'
  )
}
</script>

<template>
  <button
    type="button"
    class="favorite-song-button"
    :class="{ active: isFavorite, 'is-compact': compact }"
    :title="isFavorite ? '取消收藏' : '收藏歌曲'"
    :aria-label="`${isFavorite ? '取消收藏' : '收藏'} ${song.title}`"
    :aria-pressed="isFavorite"
    @click.stop="toggleFavorite"
  >
    <Icon :name="isFavorite ? 'heart' : 'heart-outline'" :size="compact ? 19 : 18" />
  </button>
</template>

<style scoped>
.favorite-song-button {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  transition: color 0.18s ease;
}

.favorite-song-button:hover,
.favorite-song-button.active {
  color: var(--brand-strong);
}

.favorite-song-button.is-compact {
  width: 40px;
  height: 40px;
}
</style>
