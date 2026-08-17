<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'

const props = defineProps({
  song: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  },
  queue: {
    type: Array,
    default: null
  },
  showAlbum: {
    type: Boolean,
    default: true
  }
})

const playerStore = usePlayerStore()
const userStore = useUserStore()

const isCurrent = computed(() => playerStore.currentSong?.id === props.song.id)
const isFavorite = computed(() => userStore.isFavoriteSong(props.song.id))

function play() {
  userStore.recordPlay(props.song.id)
  playerStore.playSong(props.song, props.queue || [props.song])
}

function toggleFavorite() {
  userStore.toggleFavoriteSong(props.song.id)
}
</script>

<template>
  <article
    class="song-row"
    :class="{ active: isCurrent, 'is-playing': isCurrent && playerStore.isPlaying }"
  >
    <button class="play-toggle" type="button" :title="isCurrent && playerStore.isPlaying ? '暂停' : '播放'" @click="play">
      <span v-if="isCurrent && playerStore.isPlaying">▮▮</span>
      <span v-else>▶</span>
    </button>

    <div class="song-cover">
      <img :src="song.cover" :alt="song.title" loading="lazy" />
    </div>

    <div class="song-main">
      <strong class="song-title">{{ song.title }}</strong>
      <span class="song-artist">{{ song.artist }}</span>
    </div>

    <span v-if="showAlbum" class="song-album">{{ song.album }}</span>
    <span class="song-duration">{{ song.duration }}</span>

    <button
      class="favorite-button"
      type="button"
      :title="isFavorite ? '取消收藏' : '收藏'"
      @click="toggleFavorite"
    >
      {{ isFavorite ? '♥' : '♡' }}
    </button>
  </article>
</template>

<style scoped>
.song-row {
  display: grid;
  grid-template-columns: 42px 54px minmax(180px, 1fr) minmax(120px, 0.7fr) 70px 42px;
  align-items: center;
  gap: 12px;
  min-height: 74px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.song-row:hover,
.song-row.active {
  border-color: rgba(255, 94, 148, 0.22);
  background: #fff;
  transform: translateY(-1px);
}

.song-row.active {
  box-shadow: var(--shadow-soft);
}

.play-toggle {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--primary-strong);
  font-size: 14px;
}

.play-toggle:hover {
  background: var(--primary-soft);
}

.song-cover {
  width: 54px;
  height: 54px;
  overflow: hidden;
  border-radius: 12px;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-title {
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist,
.song-album,
.song-duration {
  color: var(--muted);
  font-size: 12px;
}

.song-artist {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-album {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-button {
  color: var(--muted);
  background: transparent;
  font-size: 22px;
  transition: color 0.2s ease;
}

.favorite-button:hover {
  color: var(--primary);
}

@media (max-width: 760px) {
  .song-row {
    grid-template-columns: 40px 48px minmax(0, 1fr) 42px;
    gap: 10px;
  }

  .song-album,
  .song-duration {
    display: none;
  }

  .song-cover {
    width: 48px;
    height: 48px;
  }
}
</style>
