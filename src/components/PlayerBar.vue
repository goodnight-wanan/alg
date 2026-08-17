<script setup>
import { computed, ref } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'

const playerStore = usePlayerStore()
const userStore = useUserStore()
const showQueue = ref(false)

const modeLabel = computed(() => {
  const labels = {
    order: '顺序播放',
    loop: '单曲循环',
    shuffle: '随机播放'
  }
  return labels[playerStore.mode]
})

function onSeek(event) {
  playerStore.seekRatio(Number(event.target.value))
}

function onVolume(event) {
  playerStore.setVolume(Number(event.target.value))
}

function playAt(index) {
  playerStore.playAt(index)
  showQueue.value = false
}

function toggleFavorite() {
  if (playerStore.currentSong) {
    userStore.toggleFavoriteSong(playerStore.currentSong.id)
  }
}
</script>

<template>
  <footer class="player-bar">
    <div class="player-inner">
      <div class="now-playing">
        <div class="now-cover">
          <img
            v-if="playerStore.currentSong"
            :src="playerStore.currentSong.cover"
            :alt="playerStore.currentSong.title"
          />
          <span v-else>♪</span>
        </div>
        <div class="now-meta">
          <strong>{{ playerStore.currentSong?.title || '暂无播放' }}</strong>
          <span>{{ playerStore.currentSong?.artist || '选择一首歌曲开始播放' }}</span>
        </div>
        <button
          v-if="playerStore.currentSong"
          class="favorite-button"
          type="button"
          :title="userStore.isFavoriteSong(playerStore.currentSong.id) ? '取消收藏' : '收藏'"
          @click="toggleFavorite"
        >
          {{ userStore.isFavoriteSong(playerStore.currentSong.id) ? '♥' : '♡' }}
        </button>
      </div>

      <div class="player-center">
        <div class="player-controls">
          <button
            class="control-button"
            type="button"
            :title="modeLabel"
            @click="playerStore.cycleMode"
          >
            {{ playerStore.mode === 'shuffle' ? '⤨' : playerStore.mode === 'loop' ? '⟳' : '→' }}
          </button>
          <button class="control-button main" type="button" title="上一首" @click="playerStore.previous">
            ⏮
          </button>
          <button class="control-button main" type="button" title="播放/暂停" @click="playerStore.togglePlay">
            {{ playerStore.isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="control-button main" type="button" title="下一首" @click="playerStore.next">
            ⏭
          </button>
          <button class="control-button" type="button" title="播放队列" @click="showQueue = !showQueue">
            ☰
          </button>
        </div>

        <div class="progress-line">
          <span class="time">{{ playerStore.currentTimeText }}</span>
          <input
            class="range progress-range"
            type="range"
            min="0"
            max="1"
            step="0.001"
            :value="playerStore.progress"
            :disabled="!playerStore.currentSong"
            aria-label="播放进度"
            @input="onSeek"
          />
          <span class="time">{{ playerStore.durationText }}</span>
        </div>
      </div>

      <div class="player-volume">
        <button class="control-button" type="button" title="静音" @click="playerStore.toggleMute">
          {{ playerStore.isMuted ? '×' : '♫' }}
        </button>
        <input
          class="range volume-range"
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="playerStore.volume"
          aria-label="音量"
          @input="onVolume"
        />
      </div>
    </div>

    <Transition name="queue">
      <div v-if="showQueue && playerStore.queue.length" class="queue-panel">
        <div class="queue-head">
          <strong>播放队列</strong>
          <span>{{ playerStore.queue.length }} 首</span>
        </div>
        <ul>
          <li
            v-for="(song, index) in playerStore.queue"
            :key="`${song.id}-${index}`"
            :class="{ active: playerStore.currentIndex === index }"
            @click="playAt(index)"
          >
            <span class="queue-index">{{ index + 1 }}</span>
            <img :src="song.cover" :alt="song.title" />
            <div>
              <strong>{{ song.title }}</strong>
              <span>{{ song.artist }}</span>
            </div>
          </li>
        </ul>
      </div>
    </Transition>
  </footer>
</template>

<style scoped>
.player-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  height: var(--player-height);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(29, 23, 35, 0.96);
  color: #f7f6fb;
  box-shadow: 0 -12px 36px rgba(0, 0, 0, 0.18);
}

.player-inner {
  width: min(1240px, calc(100% - 48px));
  height: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(200px, 0.8fr) minmax(320px, 1.4fr) minmax(150px, 0.7fr);
  align-items: center;
  gap: 24px;
}

.now-playing {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.now-cover {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  color: var(--primary);
  font-size: 26px;
}

.now-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.now-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.now-meta strong,
.now-meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.now-meta strong {
  font-size: 14px;
}

.now-meta span {
  color: rgba(247, 246, 251, 0.58);
  font-size: 12px;
}

.favorite-button {
  margin-left: auto;
  background: transparent;
  color: var(--primary);
  font-size: 20px;
}

.player-center {
  min-width: 0;
}

.player-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.control-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  color: rgba(247, 246, 251, 0.82);
  font-size: 18px;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.control-button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.control-button.main {
  width: 40px;
  height: 40px;
  font-size: 20px;
}

.progress-line {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 40px;
  align-items: center;
  gap: 10px;
  margin-top: 7px;
}

.time {
  color: rgba(247, 246, 251, 0.55);
  font-size: 11px;
  text-align: center;
}

.range {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  cursor: pointer;
  appearance: none;
}

.range::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  border: 0;
  border-radius: 50%;
  background: var(--primary);
  appearance: none;
}

.range:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.player-volume {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.volume-range {
  width: min(110px, 14vw);
}

.queue-panel {
  position: absolute;
  right: max(24px, calc((100% - 1240px) / 2));
  bottom: calc(var(--player-height) + 12px);
  width: min(360px, calc(100% - 48px));
  max-height: min(480px, 60vh);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: #241f31;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
}

.queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.queue-head strong {
  font-size: 15px;
}

.queue-head span {
  color: rgba(247, 246, 251, 0.55);
  font-size: 12px;
}

.queue-panel ul {
  max-height: calc(min(480px, 60vh) - 58px);
  overflow-y: auto;
  padding: 8px;
}

.queue-panel li {
  display: grid;
  grid-template-columns: 28px 42px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
}

.queue-panel li:hover,
.queue-panel li.active {
  background: rgba(255, 94, 148, 0.16);
}

.queue-index {
  color: rgba(247, 246, 251, 0.45);
  font-size: 12px;
  text-align: center;
}

.queue-panel img {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  object-fit: cover;
}

.queue-panel li div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.queue-panel li strong,
.queue-panel li span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-panel li strong {
  font-size: 13px;
}

.queue-panel li span {
  color: rgba(247, 246, 251, 0.55);
  font-size: 11px;
}

.queue-enter-active,
.queue-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.queue-enter-from,
.queue-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .player-inner {
    grid-template-columns: minmax(160px, 0.8fr) minmax(220px, 1.4fr);
  }

  .player-volume {
    display: none;
  }
}

@media (max-width: 640px) {
  :root {
    --player-height: 148px;
  }

  .player-inner {
    width: calc(100% - 28px);
    grid-template-columns: 1fr;
    align-content: center;
    gap: 8px;
  }

  .now-playing {
    justify-content: center;
  }

  .favorite-button {
    margin-left: 10px;
  }

  .progress-line {
    margin-top: 0;
  }
}
</style>
