<script setup>
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { getPlaylistSongs } from '../data/musicData'

const props = defineProps({
  playlist: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const playerStore = usePlayerStore()

function openPlaylist() {
  router.push({ name: 'playlist', params: { id: props.playlist.id } })
}

function playAll(event) {
  event.stopPropagation()
  const list = getPlaylistSongs(props.playlist)
  if (list.length) {
    playerStore.playSong(list[0], list)
  }
}
</script>

<template>
  <article class="playlist-card" @click="openPlaylist">
    <div class="cover-wrap">
      <img :src="playlist.cover" :alt="playlist.title" loading="lazy" />
      <button class="play-button" type="button" title="播放歌单" @click="playAll">▶</button>
    </div>
    <h3 class="playlist-title">{{ playlist.title }}</h3>
    <p class="playlist-description">{{ playlist.description }}</p>
  </article>
</template>

<style scoped>
.playlist-card {
  min-width: 0;
  cursor: pointer;
}

.cover-wrap {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 18px;
  background: var(--surface-soft);
  box-shadow: var(--shadow-soft);
}

.cover-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.playlist-card:hover .cover-wrap img {
  transform: scale(1.06);
}

.play-button {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--primary-strong);
  font-size: 15px;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.playlist-card:hover .play-button {
  opacity: 1;
  transform: translateY(0);
}

.playlist-title {
  margin: 14px 0 0;
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-description {
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
