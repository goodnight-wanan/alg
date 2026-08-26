<script setup>
import { computed } from 'vue'
import { songs } from '../data/musicData'
import { usePlayerStore } from '../stores/player'

const playerStore = usePlayerStore()

const newAlbums = computed(() => songs.filter((song) => song.isNew))
const currentSong = computed(() => playerStore.currentSong)
const isPlayingList = computed(
  () => playerStore.isListActive(newAlbums.value) && playerStore.isPlaying
)

function playAll() {
  if (!newAlbums.value.length) return
  playerStore.playAll(newAlbums.value)
}

function playAlbum(album) {
  playerStore.playSong(album, newAlbums.value)
}
</script>

<template>
  <div class="functional-page album-page">
    <section class="album-hero">
      <div class="album-hero-copy">
        <span class="album-hero-tag">每周上新</span>
        <h1 class="album-hero-title">新碟首发</h1>
        <p class="album-hero-desc">本周精选 {{ newAlbums.length }} 张全新唱片，第一时间听见新鲜好声音。</p>
        <button type="button" class="album-hero-play" @click="playAll">
          <Icon :name="isPlayingList ? 'pause' : 'play'" :size="18" />
          {{ isPlayingList ? '暂停' : '播放全部' }}
        </button>
      </div>
      <div class="album-hero-mark" aria-hidden="true">
        <Icon name="music-note" :size="72" />
      </div>
    </section>

    <div class="album-head">
      <div>
        <h2 class="album-section-title">全部新碟</h2>
        <p class="album-section-meta">共 {{ newAlbums.length }} 张新碟</p>
      </div>
    </div>

    <div v-if="newAlbums.length" class="album-grid">
      <article v-for="album in newAlbums" :key="album.id" class="album-card">
        <div class="album-cover" @click="playAlbum(album)">
          <img :src="album.cover" :alt="album.album" loading="lazy" decoding="async" />
          <span class="album-badge">新碟</span>
          <button
            type="button"
            class="album-play"
            :title="currentSong?.id === album.id && playerStore.isPlaying ? '暂停' : '播放'"
            @click.stop="playAlbum(album)"
          >
            <Icon :name="currentSong?.id === album.id && playerStore.isPlaying ? 'pause' : 'play'" />
          </button>
        </div>
        <h3
          class="album-title"
          role="button"
          tabindex="0"
          :aria-label="`播放新碟 ${album.album}`"
          @click="playAlbum(album)"
          @keydown.enter.space.prevent="playAlbum(album)"
        >{{ album.album }}</h3>
        <p class="album-artist">{{ album.artist }}</p>
        <p class="album-meta">{{ album.genre }} · {{ album.duration }}</p>
      </article>
    </div>
    <div v-else class="functional-empty">暂时没有新碟上架</div>
  </div>
</template>

<style scoped>
.album-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  overflow: hidden;
  margin-bottom: 34px;
  padding: 34px 38px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--brand-soft), var(--brand-strong));
  color: #fff;
  box-shadow: 0 18px 40px rgba(233, 78, 119, 0.25);
}

.album-hero-copy {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.album-hero-tag {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}

.album-hero-title {
  margin: 14px 0 10px;
  font-size: 36px;
  letter-spacing: 3px;
  font-weight: 900;
}

.album-hero-desc {
  margin: 0 0 22px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  line-height: 1.7;
}

.album-hero-play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 132px;
  padding: 12px 26px;
  border-radius: 999px;
  background: #fff;
  color: var(--brand-strong);
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 10px 22px rgba(93, 54, 70, 0.22);
}

.album-hero-play:hover {
  background: #fff0f5;
}

.album-hero-mark {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.95);
}

.album-head {
  margin-bottom: 18px;
}

.album-section-title {
  margin: 0 0 4px;
  font-size: 24px;
  letter-spacing: 1px;
  font-weight: 900;
}

.album-section-meta {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 24px 18px;
}

.album-card {
  min-width: 0;
}

.album-cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 10px;
  background: var(--surface);
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(93, 54, 70, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.album-card:hover .album-cover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(93, 54, 70, 0.16);
}

.album-card:hover .album-cover img {
  transform: scale(1.06);
}

.album-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 9px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--brand-soft), var(--brand-strong));
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
}

.album-play {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--brand-strong);
  font-size: 18px;
  box-shadow: 0 6px 14px rgba(93, 54, 70, 0.2);
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
  cursor: pointer;
}

.album-card:hover .album-play {
  opacity: 1;
  transform: translateY(0);
}

.album-play:hover {
  background: var(--brand);
  color: #fff;
}

.album-title {
  margin: 12px 0 4px;
  overflow: hidden;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.album-title:hover {
  color: var(--brand-strong);
}

.album-artist {
  margin: 0 0 3px;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-meta {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 700px) {
  .album-hero {
    padding: 24px 22px;
  }

  .album-hero-mark {
    display: none;
  }

  .album-hero-title {
    font-size: 28px;
  }
}
</style>
