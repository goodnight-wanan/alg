<script setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { usePlayerStore } from '../stores/player'

const emit = defineEmits(['close'])

const playerStore = usePlayerStore()
const lockScroll = inject('lockScroll', () => {})
const canvasRef = ref(null)
const lineRefs = ref([])
const lyricScrollRef = ref(null)
const manualScroll = ref(false)
const charProgress = ref(0)
let manualScrollTimer = null
let animationFrame = null
let lyricFrame = null
let scrollFrame = null

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

function tickCharProgress() {
  const index = currentLineIndex.value
  const lines = lyricLines.value
  if (index >= 0 && index < lines.length) {
    const start = lines[index].time
    const end = lines[index + 1]?.time ?? start + 4
    const span = end - start
    charProgress.value =
      span > 0
        ? Math.min(1, Math.max(0, (playerStore.currentTime - start) / span))
        : 0
  } else {
    charProgress.value = 0
  }
  lyricFrame = requestAnimationFrame(tickCharProgress)
}

const activeChars = computed(() => {
  const line = lyricLines.value[currentLineIndex.value]
  if (!line) return []
  const chars = Array.from(line.text)
  const progress = charProgress.value
  return chars.map((char, i) => {
    const p = Math.min(1, Math.max(0, progress * chars.length - i))
    const r = Math.round(0x5a + (0xe9 - 0x5a) * p)
    const g = Math.round(0x52 + (0x4e - 0x52) * p)
    const b = Math.round(0x57 + (0x77 - 0x57) * p)
    return { char, color: `rgb(${r}, ${g}, ${b})` }
  })
})

function scrollToLine(index) {
  const container = lyricScrollRef.value
  const line = lineRefs.value[index]
  if (!container || !line) return

  const containerRect = container.getBoundingClientRect()
  const lineRect = line.getBoundingClientRect()
  const target =
    container.scrollTop +
    (lineRect.top - containerRect.top) -
    (container.clientHeight - lineRect.height) / 2

  const start = container.scrollTop
  const change = target - start
  if (Math.abs(change) < 1) return

  const duration = 600
  const startTime = performance.now()
  if (scrollFrame) cancelAnimationFrame(scrollFrame)

  const step = (now) => {
    const elapsed = now - startTime
    const t = Math.min(1, elapsed / duration)
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    container.scrollTop = start + change * eased
    if (t < 1) scrollFrame = requestAnimationFrame(step)
  }
  scrollFrame = requestAnimationFrame(step)
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

function drawBars() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)

  const data = playerStore.getFrequencyData()
  const barCount = 96
  const gap = 2
  const barWidth = (width - gap * (barCount - 1)) / barCount
  const maxHeight = height * 0.75
  const time = performance.now() / 1000

  const gradient = ctx.createLinearGradient(0, height, 0, 0)
  gradient.addColorStop(0, '#ffc9db')
  gradient.addColorStop(1, '#f690b0')
  ctx.fillStyle = gradient

  for (let i = 0; i < barCount; i++) {
    const t = i / (barCount - 1)
    // 波浪：随时间流动的正弦波，让柱子呈波浪状起伏
    const wave = 0.5 + 0.5 * Math.sin(t * Math.PI * 6 - time * 5)
    // 频谱调制：让柱子随音乐跳动，0.35 基底保证无声时也有波浪
    let boost = 1
    if (data) {
      const bin = Math.round(t * (data.length - 1))
      boost = 0.35 + 0.65 * Math.pow(data[bin] / 255, 0.5)
    }
    const h = Math.max(3, wave * boost * maxHeight)
    ctx.fillRect(i * (barWidth + gap), height - h, barWidth, h)
  }

  animationFrame = requestAnimationFrame(drawBars)
}

onMounted(() => {
  document.body.classList.add('modal-open')
  lockScroll(true)
  drawBars()
  tickCharProgress()
})

onUnmounted(() => {
  lockScroll(false)
  document.body.classList.remove('modal-open')
  if (animationFrame) cancelAnimationFrame(animationFrame)
  if (lyricFrame) cancelAnimationFrame(lyricFrame)
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
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
          <div ref="lyricScrollRef" class="lyric-scroll" @scroll="onLyricScroll">
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
  flex: 0 0 25%;
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
