<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PlaylistCard from '../components/PlaylistCard.vue'
import SongRow from '../components/SongRow.vue'
import { playlists, songs } from '../data/musicData'

const slides = [
  {
    image: '/assets/imgs/homepage/carousel/carousel1.png',
    title: '听见此刻的心动',
    subtitle: '精选歌单，让每一次播放都恰到好处'
  },
  {
    image: '/assets/imgs/homepage/carousel/carousel2.png',
    title: '新歌首发，先听为快',
    subtitle: '第一时间接收新鲜好音乐'
  },
  {
    image: '/assets/imgs/homepage/carousel/carousel3.png',
    title: '排行榜单，热度全知道',
    subtitle: '飙升、热歌与新歌，一站掌握'
  },
  {
    image: '/assets/imgs/homepage/carousel/carousel4.png',
    title: '风格由你，自由切换',
    subtitle: '流行、民谣、电音、古典，总有一种适合你'
  }
]

const activeSlide = ref(0)
let slideTimer = null

const recommendedPlaylists = computed(() => playlists.slice(0, 10))
const newSongs = computed(() => songs.filter((song) => song.isNew))
const chartGroups = computed(() =>
  ['飙升榜', '热歌榜', '新歌榜'].map((chart) => ({
    name: chart,
    songs: songs.filter((song) => song.chart === chart).slice(0, 5)
  }))
)

function goTo(index) {
  activeSlide.value = (index + slides.length) % slides.length
}

function nextSlide() {
  goTo(activeSlide.value + 1)
}

function previousSlide() {
  goTo(activeSlide.value - 1)
}

function startTimer() {
  stopTimer()
  slideTimer = window.setInterval(nextSlide, 4500)
}

function stopTimer() {
  if (slideTimer) {
    window.clearInterval(slideTimer)
    slideTimer = null
  }
}

onMounted(startTimer)
onUnmounted(stopTimer)
</script>

<template>
  <div class="home-view">
    <section class="hero-section" @mouseenter="stopTimer" @mouseleave="startTimer">
      <div class="hero-slides">
        <Transition name="fade" mode="out-in">
          <div class="hero-slide" :key="activeSlide">
            <img :src="slides[activeSlide].image" :alt="slides[activeSlide].title" />
            <div class="hero-copy">
              <p class="hero-eyebrow">YUE YIN MUSIC</p>
              <h1>{{ slides[activeSlide].title }}</h1>
              <p>{{ slides[activeSlide].subtitle }}</p>
            </div>
          </div>
        </Transition>

        <button class="hero-arrow left" type="button" title="上一张" @click="previousSlide">‹</button>
        <button class="hero-arrow right" type="button" title="下一张" @click="nextSlide">›</button>

        <div class="hero-dots">
          <button
            v-for="(slide, index) in slides"
            :key="slide.image"
            type="button"
            :class="{ active: activeSlide === index }"
            :aria-label="`切换到第 ${index + 1} 张`"
            @click="goTo(index)"
          />
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <h2 class="section-title">推荐歌单</h2>
          <p class="section-subtitle">按心情和风格，挑一张陪你度过今天</p>
        </div>
        <RouterLink class="section-more" to="/category">查看全部 →</RouterLink>
      </div>
      <div class="grid playlist-grid">
        <PlaylistCard
          v-for="playlist in recommendedPlaylists"
          :key="playlist.id"
          :playlist="playlist"
        />
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <h2 class="section-title">新歌首发</h2>
          <p class="section-subtitle">第一时间听点新鲜的</p>
        </div>
        <RouterLink class="section-more" to="/search?tab=song">更多歌曲 →</RouterLink>
      </div>
      <div class="song-list">
        <SongRow
          v-for="(song, index) in newSongs"
          :key="song.id"
          :song="song"
          :index="index"
          :queue="newSongs"
        />
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <h2 class="section-title">排行榜</h2>
          <p class="section-subtitle">飙升、热歌与新歌，热度一目了然</p>
        </div>
      </div>

      <div class="chart-grid">
        <article v-for="group in chartGroups" :key="group.name" class="chart-card">
          <div class="chart-head">
            <div>
              <span class="badge">{{ group.name }}</span>
              <h3>{{ group.name }}</h3>
            </div>
            <span class="chart-count">{{ group.songs.length }} 首</span>
          </div>
          <div class="chart-list">
            <SongRow
              v-for="(song, index) in group.songs"
              :key="song.id"
              :song="song"
              :index="index"
              :queue="group.songs"
              :show-album="false"
            />
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-section {
  margin-bottom: 8px;
}

.hero-slides {
  position: relative;
  aspect-ratio: 21 / 8;
  min-height: 320px;
  overflow: hidden;
  border-radius: 28px;
  box-shadow: var(--shadow);
}

.hero-slide {
  position: absolute;
  inset: 0;
}

.hero-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-copy {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 7%;
  background: linear-gradient(90deg, rgba(19, 13, 24, 0.74), rgba(19, 13, 24, 0.08));
  color: #fff;
}

.hero-eyebrow {
  margin: 0 0 10px;
  color: #ff9dba;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
}

.hero-copy h1 {
  margin: 0;
  max-width: 720px;
  font-size: clamp(32px, 5vw, 64px);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.hero-copy p:last-child {
  margin: 18px 0 0;
  max-width: 560px;
  color: rgba(255, 255, 255, 0.76);
  font-size: clamp(14px, 2vw, 19px);
}

.hero-arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 46px;
  height: 62px;
  transform: translateY(-50%);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 40px;
  line-height: 1;
  opacity: 0;
  transition:
    opacity 0.25s ease,
    background 0.25s ease;
}

.hero-slides:hover .hero-arrow {
  opacity: 1;
}

.hero-arrow:hover {
  background: rgba(255, 255, 255, 0.32);
}

.hero-arrow.left {
  left: 18px;
}

.hero-arrow.right {
  right: 18px;
}

.hero-dots {
  position: absolute;
  right: 24px;
  bottom: 20px;
  z-index: 2;
  display: flex;
  gap: 8px;
}

.hero-dots button {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.42);
  transition:
    width 0.25s ease,
    background 0.25s ease;
}

.hero-dots button.active {
  width: 28px;
  background: #fff;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.chart-card {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
}

.chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.chart-head h3 {
  margin: 10px 0 0;
  font-size: 22px;
}

.chart-count {
  color: var(--muted);
  font-size: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-slides {
    aspect-ratio: 4 / 3;
    min-height: 260px;
    border-radius: 20px;
  }

  .hero-copy {
    padding: 10%;
    background: linear-gradient(180deg, rgba(19, 13, 24, 0.14), rgba(19, 13, 24, 0.72));
    justify-content: flex-end;
  }

  .hero-arrow {
    opacity: 1;
  }
}
</style>
