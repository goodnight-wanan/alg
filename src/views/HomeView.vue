<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PlaylistCard from '../components/PlaylistCard.vue'
import SongRow from '../components/SongRow.vue'
import { playlists, songs } from '../data/musicData'

const slides = [
  '/assets/imgs/homepage/carousel/carousel1.png',
  '/assets/imgs/homepage/carousel/carousel2.png',
  '/assets/imgs/homepage/carousel/carousel3.png',
  '/assets/imgs/homepage/carousel/carousel4.png'
]

const activeSlide = ref(0)
let slideTimer = null

const recommendedPlaylists = computed(() => playlists.slice(0, 10))
const newSongs = computed(() => songs.filter((song) => song.isNew))
const chartGroups = computed(() =>
  ['飙升榜', '热歌榜', '新歌榜'].map((chart) => ({
    name: chart,
    cover: {
      飙升榜: '/assets/imgs/homepage/chart_back/chart_b1.png',
      热歌榜: '/assets/imgs/homepage/chart_back/chart_b2.png',
      新歌榜: '/assets/imgs/homepage/chart_back/chart_b3.png'
    }[chart],
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
      <div class="carousel">
        <img :src="slides[activeSlide]" alt="精彩推荐" />
        <button class="carousel-button left" type="button" title="上一张" @click="previousSlide">&lt;</button>
        <button class="carousel-button right" type="button" title="下一张" @click="nextSlide">&gt;</button>
        <div class="carousel-points">
          <button
            v-for="(slide, index) in slides"
            :key="slide"
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
        <h2 class="section-title">歌单推荐</h2>
        <RouterLink class="section-more" to="/category">更多 &gt;&gt;</RouterLink>
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
        <h2 class="section-title">新歌首发</h2>
        <RouterLink class="section-more" to="/search?tab=song">更多 &gt;&gt;</RouterLink>
      </div>
      <div class="new-song-grid">
        <SongRow
          v-for="(song, index) in newSongs"
          :key="song.id"
          :song="song"
          :index="index"
          :queue="newSongs"
          :show-album="false"
        />
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">排行榜</h2>
      </div>

      <div class="chart-grid">
        <article
          v-for="group in chartGroups"
          :key="group.name"
          class="chart-card"
          :style="{ backgroundImage: `url(${group.cover})` }"
        >
          <div class="chart-overlay"></div>
          <div class="chart-head">
            <h3>{{ group.name }}</h3>
            <span>{{ group.songs.length }} 首</span>
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
  margin-top: 35px;
}

.carousel {
  position: relative;
  width: min(1200px, 100%);
  aspect-ratio: 1200 / 520;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 15px;
  box-shadow: var(--shadow);
}

.carousel img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-button {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 70px;
  height: 100px;
  transform: translateY(-50%);
  border: 1px solid #191516;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: #191516;
  font-size: 100px;
  line-height: 100px;
  transition: 0.5s;
}

.carousel-button.left {
  left: -90px;
}

.carousel-button.right {
  right: -90px;
}

.carousel:hover .carousel-button.left {
  left: 0;
}

.carousel:hover .carousel-button.right {
  right: 0;
}

.carousel-button:hover {
  background: rgba(25, 25, 25, 0.1);
}

.carousel-points {
  position: absolute;
  right: 0;
  bottom: 18px;
  left: 0;
  display: flex;
  justify-content: center;
  gap: 22px;
}

.carousel-points button {
  width: 30px;
  height: 30px;
  border: 5px solid rgba(25, 25, 25, 0.5);
  border-radius: 50%;
  background-position: center;
  background-size: cover;
  cursor: pointer;
}

.carousel-points button:nth-child(1) {
  background-image: url('/assets/imgs/homepage/carousel/carousel1.png');
}

.carousel-points button:nth-child(2) {
  background-image: url('/assets/imgs/homepage/carousel/carousel2.png');
}

.carousel-points button:nth-child(3) {
  background-image: url('/assets/imgs/homepage/carousel/carousel3.png');
}

.carousel-points button:nth-child(4) {
  background-image: url('/assets/imgs/homepage/carousel/carousel4.png');
}

.carousel-points button.active {
  border-color: pink;
}

.section-head {
  position: relative;
}

.section-more {
  position: absolute;
  right: 70px;
  bottom: 0;
}

.new-song-grid {
  width: min(1400px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.new-song-grid :deep(.song-row) {
  min-height: 150px;
  grid-template-columns: 46px 140px minmax(0, 1fr) 90px 38px;
  gap: 18px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.35);
}

.new-song-grid :deep(.song-row:hover) {
  top: -10px;
  left: 15px;
  box-shadow: 0 5px 10px 5px rgba(25, 25, 25, 0.2);
  background: rgba(255, 255, 255, 0.5);
}

.new-song-grid :deep(.song-cover) {
  width: 140px;
  height: 150px;
  border-radius: 10px;
}

.new-song-grid :deep(.play-toggle) {
  width: 46px;
  height: 46px;
}

.chart-grid {
  width: min(1200px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.chart-card {
  position: relative;
  min-height: 500px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  background-position: center;
  background-size: cover;
  transition: 0.4s;
}

.chart-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 10px 5px rgba(25, 25, 25, 0.2);
}

.chart-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.chart-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(300px, 82%);
  margin: 30px auto 18px;
  padding: 0 10px;
  color: #fff;
  text-shadow: 2px 2px rgba(0, 0, 0, 0.22);
}

.chart-head h3 {
  margin: 0;
  font-size: clamp(28px, 4vw, 45px);
  letter-spacing: 4px;
}

.chart-head span {
  font-size: 13px;
}

.chart-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(300px, 82%);
  margin: 0 auto;
}

.chart-list :deep(.song-row) {
  min-height: 68px;
  grid-template-columns: 36px 48px minmax(0, 1fr) 34px;
  background: rgba(255, 255, 255, 0.78);
}

.chart-list :deep(.song-cover) {
  width: 48px;
  height: 48px;
}

@media (max-width: 1080px) {
  .new-song-grid {
    grid-template-columns: 1fr;
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .carousel {
    border-radius: 10px;
  }

  .carousel-button {
    width: 36px;
    height: 54px;
    font-size: 46px;
    line-height: 54px;
  }

  .carousel-button.left {
    left: 6px;
  }

  .carousel-button.right {
    right: 6px;
  }

  .carousel-points {
    gap: 10px;
  }

  .carousel-points button {
    width: 20px;
    height: 20px;
    border-width: 3px;
  }

  .section-more {
    right: 4px;
  }
}
</style>
