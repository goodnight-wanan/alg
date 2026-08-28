<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { songs } from '../data/musicData'
import { usePlayerStore } from '../stores/player'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const chartNames = ['飙升榜', '热歌榜', '新歌榜']

const charts = chartNames.map((name) => ({
  name,
  songs: songs.filter((song) => song.chart === name)
}))

const activeChartName = computed(() => {
  const name = String(route.query.chart || '')
  return chartNames.includes(name) ? name : chartNames[0]
})

const activeChart = computed(() => charts.find((chart) => chart.name === activeChartName.value))

const currentSong = computed(() => playerStore.currentSong)

const isPlayingList = computed(
  () => playerStore.isListActive(activeChart.value?.songs || []) && playerStore.isPlaying
)

function selectChart(name) {
  router.replace({ name: 'rank', query: { chart: name } })
}

function playAll(chart) {
  if (!chart.songs.length) return
  playerStore.playAll(chart.songs)
}

function playSong(song, list) {
  playerStore.playSong(song, list)
}
</script>

<template>
  <div class="functional-page rank-page">
    <h1 class="functional-title">排行榜</h1>

    <div class="rank-charts">
      <button
        v-for="(chart, index) in charts"
        :key="chart.name"
        type="button"
        class="rank-chart-card"
        :class="[`chart${index + 1}`, { active: activeChartName === chart.name }]"
        @click="selectChart(chart.name)"
      >
        <div class="rank-chart-info">
          <h2 class="rank-chart-name">{{ chart.name }}</h2>
          <ol class="rank-chart-top">
            <li v-for="(song, i) in chart.songs.slice(0, 3)" :key="song.id">
              <span class="rank-chart-top-num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="rank-chart-top-text">{{ song.title }} - {{ song.artist }}</span>
            </li>
          </ol>
        </div>
      </button>
    </div>

    <section v-if="activeChart" class="rank-detail">
      <div class="rank-detail-head">
        <div>
          <h2 class="rank-detail-title">{{ activeChart.name }}</h2>
          <p class="rank-detail-meta">共 {{ activeChart.songs.length }} 首</p>
        </div>
        <button type="button" class="rank-play-all" @click="playAll(activeChart)">
          <Icon :name="isPlayingList ? 'pause' : 'play'" :size="18" />
          {{ isPlayingList ? '暂停' : '播放全部' }}
        </button>
      </div>

      <div class="rank-list">
        <div
          v-for="(song, index) in activeChart.songs.slice(0, 20)"
          :key="song.id"
          class="rank-row"
          :class="[`rank-${index + 1}`, { playing: currentSong?.id === song.id }]"
        >
          <span class="rank-num">{{ String(index + 1).padStart(2, '0') }}</span>
          <button type="button" class="row-play" @click="playSong(song, activeChart.songs)">
            <Icon :name="currentSong?.id === song.id && playerStore.isPlaying ? 'pause' : 'play'" />
          </button>
          <img :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
          <strong>{{ song.title }} - {{ song.artist }}</strong>
          <span>{{ song.album }}</span>
          <span>{{ song.duration }}</span>
          <div class="song-action-group">
            <FavoriteSongButton :song="song" />
            <AddToPlaylistButton :song="song" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.rank-charts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 30px;
}

.rank-chart-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.rank-chart-card.chart1.active {
  background: linear-gradient(150deg, rgba(255, 158, 196, 0.5), rgba(233, 78, 119, 0.5));
}

.rank-chart-card.chart2.active {
  background: linear-gradient(210deg, rgba(255, 126, 179, 0.5), rgba(216, 74, 114, 0.5));
}

.rank-chart-card.chart3.active {
  background: linear-gradient(120deg, rgba(255, 126, 179, 0.5), rgba(233, 78, 119, 0.5));
}

.rank-chart-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(93, 54, 70, 0.12);
}

.rank-chart-card.active {
  border-color: var(--brand);
  box-shadow: 0 12px 26px rgba(255, 126, 179, 0.22);
}

.rank-chart-info {
  min-width: 0;
}

.rank-chart-name {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 1px;
}

.rank-chart-top {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rank-chart-top li {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
}

.rank-chart-top-num {
  flex: 0 0 auto;
  color: rgba(25, 25, 25, 0.8);
  font-weight: 800;
}

.rank-chart-top-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-detail-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.rank-detail-title {
  margin: 0 0 6px;
  font-size: 28px;
  letter-spacing: 1px;
  font-weight: 900;
}

.rank-detail-meta {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.rank-play-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 132px;
  padding: 11px 22px;
  border-radius: 999px;
  background: var(--brand);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.rank-play-all:hover {
  background: var(--brand-hover);
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-row {
  display: grid;
  grid-template-columns: 48px 42px 56px minmax(0, 1fr) 120px 84px 90px;
  align-items: center;
  gap: 12px;
  min-height: 70px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  background: var(--surface);
}

.rank-row img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
}

.rank-row strong,
.rank-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-row span {
  color: var(--text-secondary);
  font-size: 13px;
}

.rank-num {
  text-align: center;
  font-size: 15px;
  font-weight: 900;
  color: #a8afba;
}

.rank-row.rank-1 .rank-num {
  color: #f5b301;
  font-size: 20px;
}

.rank-row.rank-2 .rank-num {
  color: #b7c0cc;
  font-size: 19px;
}

.rank-row.rank-3 .rank-num {
  color: #cd8b62;
  font-size: 18px;
}

.rank-row.playing {
  border-color: rgba(255, 105, 157, 0.5);
  background: rgba(255, 192, 203, 0.28);
}

@media (max-width: 960px) {
  .rank-charts {
    grid-template-columns: 1fr;
  }

  .rank-row {
    grid-template-columns: 44px 40px 48px minmax(0, 1fr) 90px 90px;
  }

  .rank-row span:last-child {
    display: none;
  }
}

@media (max-width: 700px) {
  .rank-row {
    grid-template-columns: 36px 38px 44px minmax(0, 1fr) 80px;
  }

  .rank-row span {
    display: none;
  }
}
</style>
