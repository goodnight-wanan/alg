<script setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { usePlayerStore } from '../stores/player'

const emit = defineEmits(['close'])

const playerStore = usePlayerStore()
const lockScroll = inject('lockScroll', () => {})
const canvasRef = ref(null)
const lineRefs = ref([])
const manualScroll = ref(false)
let manualScrollTimer = null
let animationFrame = null

function parseLyric(lyricText) {
  if (!lyricText) return []
  const lines = []
  const timeTag = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
  for (const raw of lyricText.split(/\r?\n/)) {
    const text = raw.replace(/\[[^\]]*\]/g, '').trim()
    if (!text) continue
    for (const match of raw.matchAll(timeTag)) {
      const minutes = Number(match[1])
      const seconds = Number(match[2])
      const fraction = match[3] ? Number(`0.${match[3]}`) : 0
      lines.push({ time: minutes * 60 + seconds + fraction, text })
    }
  }
  lines.sort((a, b) => a.time - b.time)
  return lines
}

const lyricLines = computed(() => parseLyric(playerStore.currentSong?.lyric))

const currentLineIndex = computed(() => {
  const time = playerStore.currentTime
  let index = -1
  for (let i = 0; i < lyricLines.value.length; i++) {
    if (lyricLines.value[i].time <= time) index = i
    else break
  }
  return index
})

const currentLineProgress = computed(() => {
  const index = currentLineIndex.value
  const lines = lyricLines.value
  if (index < 0 || !lines.length) return 0
  const start = lines[index].time
  const end = lines[index + 1]?.time ?? start + 4
  const span = end - start
  if (span <= 0) return 0
  return Math.min(1, Math.max(0, (playerStore.currentTime - start) / span))
})

const activeChars = computed(() => {
  const line = lyricLines.value[currentLineIndex.value]
  if (!line) return []
  const chars = Array.from(line.text)
  const progress = currentLineProgress.value
  return chars.map((char, i) => {
    const p = Math.min(1, Math.max(0, progress * chars.length - i))
    const r = Math.round(0x5a + (0xe9 - 0x5a) * p)
    const g = Math.round(0x52 + (0x4e - 0x52) * p)
    const b = Math.round(0x57 + (0x77 - 0x57) * p)
    return { char, color: `rgb(${r}, ${g}, ${b})` }
  })
})

function scrollToLine(index) {
  lineRefs.value[index]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

watch(currentLineIndex, (index) => {
  if (index < 0 || manualScroll.value) return
  scrollToLine(index)
})

function onLyricScroll() {
  manualScroll.value = true
  window.clearTimeout(manualScrollTimer)
  manualScrollTimer = window.setTimeout(() => {
    manualScroll.value = false
    if (currentLineIndex.value >= 0) scrollToLine(currentLineIndex.value)
  }, 3000)
}

function onLineClick(line) {
  playerStore.seekTo(line.time)
  manualScroll.value = false
}

function drawSpectrum() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)

  const data = playerStore.getFrequencyData()
  if (data) {
    const barCount = 128
    const gap = 2
    const barWidth = (width - gap * (barCount - 1)) / barCount
    const maxHeight = height * 0.5

    const gradient = ctx.createLinearGradient(0, height, 0, 0)
    gradient.addColorStop(0, '#ffc9db')
    gradient.addColorStop(1, '#f690b0')
    ctx.fillStyle = gradient

    const center = (barCount - 1) / 2

    for (let i = 0; i < barCount; i++) {
      const dist = Math.abs(i - center) / center
      // 线性铺开频率，避免低频能量全堆在中间几根柱子上
      const bin = Math.round(dist * (data.length - 1))
      // 0.45 次幂压缩，把低频(≈255)和高频(≈0)的巨大差距压平，让两边也有起伏
      const raw = data[bin] / 255
      const value = Math.pow(raw, 0.45) * 255
      const barHeight = Math.max(3, (value / 255) * maxHeight)
      ctx.fillRect(i * (barWidth + gap), height - barHeight, barWidth, barHeight)
    }
  }

  animationFrame = requestAnimationFrame(drawSpectrum)
}

onMounted(() => {
  document.body.classList.add('modal-open')
  lockScroll(true)
  drawSpectrum()
})

onUnmounted(() => {
  lockScroll(false)
  document.body.classList.remove('modal-open')
  if (animationFrame) cancelAnimationFrame(animationFrame)
  window.clearTimeout(manualScrollTimer)
})
</script>

<template>
  <div class="lyric-panel" @click.self="emit('close')">
    <header class="lyric-panel-head">
      <button
        class="lyric-panel-close"
        type="button"
        aria-label="收起歌词"
        @click="emit('close')"
      >
        <Icon name="chevron-down" :size="24" />
      </button>
    </header>

    <div class="lyric-panel-body">
      <div class="lyric-panel-main">
        <section class="lyric-panel-visual">
          <div class="disc" :class="{ playing: playerStore.isPlaying }">
            <img
              v-if="playerStore.currentSong"
              :src="playerStore.currentSong.cover"
              :alt="playerStore.currentSong.title"
            />
            <span class="disc-hole"></span>
          </div>
        </section>

        <section class="lyric-panel-lyrics">
          <div class="lyric-panel-lyrics-head">
            <strong>{{ playerStore.currentSong?.title || '暂无播放' }}</strong>
            <span>{{ playerStore.currentSong?.artist || '' }}</span>
          </div>
          <div class="lyric-scroll" @scroll="onLyricScroll">
            <ul v-if="lyricLines.length">
              <li
                v-for="(line, index) in lyricLines"
                :key="index"
                :ref="(el) => (lineRefs[index] = el)"
                :class="{ active: index === currentLineIndex }"
              >
                <span class="lyric-line-text">
                  <template v-if="index === currentLineIndex">
                    <span
                      v-for="(c, ci) in activeChars"
                      :key="ci"
                      class="lyric-char"
                      :style="{ color: c.color }"
                      >{{ c.char }}</span
                    >
                  </template>
                  <template v-else>{{ line.text }}</template>
                </span>
                <button
                  class="lyric-line-play"
                  type="button"
                  :aria-label="`从这句播放`"
                  @click="onLineClick(line)"
                >
                  <Icon name="play" :size="16" />
                </button>
              </li>
            </ul>
            <p v-else class="lyric-empty">暂无歌词</p>
          </div>
        </section>
      </div>

      <div class="lyric-panel-spectrum">
        <canvas ref="canvasRef" class="spectrum" width="1000" height="180"></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lyric-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: var(--player-height);
  left: 0;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  background: rgb(255 214 214 / 92%);
  backdrop-filter: blur(20px);
  user-select: none;
  -webkit-user-select: none;
}

.lyric-panel-head {
  display: flex;
  align-items: center;
  padding: 14px 24px;
  flex: 0 0 auto;
}

.lyric-panel-close {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.lyric-panel-close:hover {
  color: var(--brand-strong);
  transform: translateY(2px);
}

.lyric-panel-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 40px 16px;
  overflow: hidden;
}

.lyric-panel-main {
  margin-top: 90px;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  justify-content: center;
  gap: 250px;
}

.lyric-panel-visual {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.disc {
  position: relative;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  box-shadow: 0 18px 40px rgba(93, 54, 70, 0.25);
  animation: disc-spin 20s linear infinite;
  animation-play-state: paused;
}

.disc.playing {
  animation-play-state: running;
}

.disc img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.disc-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48px;
  height: 48px;
  transform: translate(-50%, -50%);
  border: 4px solid rgba(233, 78, 119, 0.3);
  border-radius: 50%;
  background: rgb(255 214 214);
}

@keyframes disc-spin {
  to {
    transform: rotate(360deg);
  }
}

.lyric-panel-lyrics {
  flex: 0 1 640px;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.lyric-panel-lyrics-head {
  flex: 0 0 auto;
  margin-bottom: 16px;
}

.lyric-panel-lyrics-head strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 40px;
}

.lyric-panel-lyrics-head span {
  color: var(--text-secondary);
  font-size: 18px;
}

.lyric-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding-right: 12px;
  scrollbar-width: none;
}

.lyric-scroll::-webkit-scrollbar {
  display: none;
}

.lyric-scroll ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lyric-scroll li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 36px;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    font-size 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.lyric-scroll li:hover:not(.active) {
  background: rgba(255, 126, 179, 0.08);
}

.lyric-scroll li.active {
  color: var(--brand-strong);
  font-weight: 800;
  font-size: 25px;
}

.lyric-char {
  color: var(--text-secondary);
}

.lyric-line-text {
  flex: 1 1 0;
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}

.lyric-line-play {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 126, 179, 0.12);
  color: var(--brand-strong);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.18s ease,
    background 0.18s ease;
}

.lyric-scroll li:hover:not(.active) .lyric-line-play {
  opacity: 1;
}

.lyric-line-play:hover {
  background: rgba(255, 126, 179, 0.24);
}

.lyric-empty {
  margin: 0;
  padding: 32px 0;
  color: var(--text-muted);
  text-align: center;
  font-size: 50px;
}

.lyric-panel-spectrum {
  flex: 0 0 30%;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding-top: 8px;
}

.spectrum {
  display: block;
  width: min(100%, 900px);
  height: 100%;
}
</style>
