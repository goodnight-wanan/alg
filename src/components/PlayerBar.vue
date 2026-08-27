<script setup>
import { computed, ref } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { showNotice } from '../utils/notice'

const playerStore = usePlayerStore()
const userStore = useUserStore()
const showQueue = ref(false)
const volumePercent = computed(() => Math.round(playerStore.volume * 100))

const modeLabel = computed(() => {
  const labels = {
    order: '顺序播放',
    'list-loop': '列表循环',
    loop: '单曲循环',
    shuffle: '随机播放'
  }
  return labels[playerStore.mode]
})

const modeIcon = computed(() => playerStore.mode)

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
  if (!playerStore.currentSong) return

  if (!userStore.isLoggedIn) {
    showNotice('请先登录后再收藏')
    return
  }

  userStore.toggleFavoriteSong(playerStore.currentSong.id)
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
          <Icon v-else name="music-note" :size="28" />
        </div>
        <div class="vue-player-meta" aria-live="polite">
          <strong>{{ playerStore.currentSong?.title || '暂无播放' }}</strong>
          <span>{{ playerStore.currentSong?.artist || '选择一首歌曲开始播放' }}</span>
        </div>
        <button
          v-if="playerStore.currentSong"
          class="vue-player-favorite"
          :class="{ active: userStore.isFavoriteSong(playerStore.currentSong.id) }"
          type="button"
          :title="userStore.isFavoriteSong(playerStore.currentSong.id) ? '取消收藏' : '收藏'"
          @click="toggleFavorite"
        >
          <Icon
            :name="userStore.isFavoriteSong(playerStore.currentSong.id) ? 'heart' : 'heart-outline'"
          />
        </button>
      </div>

      <div>
        <div class="vue-player-controls">
          <button
            class="vue-player-button"
            type="button"
            :title="modeLabel"
            :aria-label="modeLabel"
            @click="playerStore.cycleMode"
          >
            <Icon :name="modeIcon" />
          </button>
          <button
            class="vue-player-button"
            type="button"
            title="上一首"
            @click="playerStore.previous"
          >
            <Icon name="previous" />
          </button>
          <button
            class="vue-player-button"
            type="button"
            title="播放/暂停"
            @click="playerStore.togglePlay"
          >
            <Icon :name="playerStore.isPlaying ? 'pause' : 'play'" />
          </button>
          <button class="vue-player-button" type="button" title="下一首" @click="playerStore.next">
            <Icon name="next" />
          </button>
          <button
            class="vue-player-button"
            type="button"
            title="播放队列"
            aria-label="播放队列"
            :aria-expanded="showQueue"
            @click="showQueue = !showQueue"
          >
            <Icon name="queue" />
          </button>
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
            :aria-valuetext="`${playerStore.currentTimeText} / ${playerStore.durationText}`"
            @input="onSeek"
          />
          <span class="vue-player-time">{{ playerStore.durationText }}</span>
        </div>
      </div>

      <div class="vue-player-volume">
        <button
          class="vue-player-button"
          type="button"
          title="静音"
          @click="playerStore.toggleMute"
        >
          <Icon :name="playerStore.isMuted ? 'mute' : 'volume'" />
        </button>
        <input
          class="vue-player-range"
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="playerStore.volume"
          aria-label="音量"
          :aria-valuetext="`${volumePercent}%`"
          @input="onVolume"
        />
        <span class="vue-player-volume-value">{{ volumePercent }}%</span>
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
            role="button"
            tabindex="0"
            :aria-current="playerStore.currentIndex === index ? 'true' : undefined"
            :aria-label="`播放 ${song.title} - ${song.artist}`"
            @click="playAt(index)"
            @keydown.enter.space.prevent="playAt(index)"
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
