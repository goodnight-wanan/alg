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
  <footer class="vue-player">
    <div class="vue-player-inner">
      <div class="vue-player-now">
        <div class="vue-player-cover">
          <img
            v-if="playerStore.currentSong"
            :src="playerStore.currentSong.cover"
            :alt="playerStore.currentSong.title"
          />
          <span v-else>♪</span>
        </div>
        <div class="vue-player-meta">
          <strong>{{ playerStore.currentSong?.title || '暂无播放' }}</strong>
          <span>{{ playerStore.currentSong?.artist || '选择一首歌曲开始播放' }}</span>
        </div>
        <button
          v-if="playerStore.currentSong"
          class="vue-player-favorite"
          type="button"
          :title="userStore.isFavoriteSong(playerStore.currentSong.id) ? '取消收藏' : '收藏'"
          @click="toggleFavorite"
        >
          {{ userStore.isFavoriteSong(playerStore.currentSong.id) ? '♥' : '♡' }}
        </button>
      </div>

      <div>
        <div class="vue-player-controls">
          <button
            class="vue-player-button"
            type="button"
            :title="modeLabel"
            @click="playerStore.cycleMode"
          >
            {{ playerStore.mode === 'shuffle' ? '⤨' : playerStore.mode === 'loop' ? '⟳' : '→' }}
          </button>
          <button class="vue-player-button" type="button" title="上一首" @click="playerStore.previous">⏮</button>
          <button class="vue-player-button" type="button" title="播放/暂停" @click="playerStore.togglePlay">
            {{ playerStore.isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="vue-player-button" type="button" title="下一首" @click="playerStore.next">⏭</button>
          <button class="vue-player-button" type="button" title="播放队列" @click="showQueue = !showQueue">☰</button>
        </div>

        <div class="vue-player-progress">
          <span class="vue-player-time">{{ playerStore.currentTimeText }}</span>
          <input
            class="vue-player-range"
            type="range"
            min="0"
            max="1"
            step="0.001"
            :value="playerStore.progress"
            :disabled="!playerStore.currentSong"
            aria-label="播放进度"
            @input="onSeek"
          />
          <span class="vue-player-time">{{ playerStore.durationText }}</span>
        </div>
      </div>

      <div class="vue-player-volume">
        <button class="vue-player-button" type="button" title="静音" @click="playerStore.toggleMute">
          {{ playerStore.isMuted ? '×' : '♫' }}
        </button>
        <input
          class="vue-player-range"
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
      <div v-if="showQueue && playerStore.queue.length" class="vue-player-queue">
        <div class="vue-player-queue-head">
          <strong>播放队列</strong>
          <span>{{ playerStore.queue.length }} 首</span>
        </div>
        <ul class="vue-player-queue-list">
          <li
            v-for="(song, index) in playerStore.queue"
            :key="`${song.id}-${index}`"
            class="vue-player-queue-item"
            :class="{ active: playerStore.currentIndex === index }"
            @click="playAt(index)"
          >
            <span>{{ index + 1 }}</span>
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
