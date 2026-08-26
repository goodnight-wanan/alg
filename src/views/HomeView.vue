<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { homePlaylistTabs, playlists, songs } from '../data/musicData'
import { usePlayerStore } from '../stores/player'
import { usePageCss } from '../utils/pageCss'
import { showNotice } from '../utils/notice'

usePageCss(['/assets/css/style.css'])

const router = useRouter()
const playerStore = usePlayerStore()

const activeSlide = ref(0)
const carouselPaused = ref(false)
let slideTimer = null

const slides = [
  { src: '/assets/imgs/homepage/carousel/carousel1.jpg', alt: '悦音音乐推荐横幅一' },
  { src: '/assets/imgs/homepage/carousel/carousel2.jpg', alt: '悦音音乐推荐横幅二' },
  { src: '/assets/imgs/homepage/carousel/carousel3.jpg', alt: '悦音音乐推荐横幅三' },
  { src: '/assets/imgs/homepage/carousel/carousel4.jpg', alt: '悦音音乐推荐横幅四' }
]

const activePlaylistTab = ref(homePlaylistTabs[0].key)
const playlistPage = ref(0)

const regionTabs = [
  { key: 'all', label: '最新' },
  { key: '内地', label: '内地' },
  { key: '港台', label: '港台' },
  { key: '欧美', label: '欧美' },
  { key: '韩国', label: '韩国' },
  { key: '日本', label: '日本' }
]
const regionAlias = { 韩国: '日韩', 日本: '日韩' }

const activeNewRegion = ref('all')
const activeChartRegion = ref('all')

const currentPlaying = computed(() => playerStore.currentSong)

const activePlaylistList = computed(() => {
  const tab = homePlaylistTabs.find((item) => item.key === activePlaylistTab.value)
  return (tab?.ids || [])
    .map((id) => playlists.find((playlist) => playlist.id === id))
    .filter(Boolean)
})

const playlistPageCount = computed(() =>
  Math.max(1, Math.ceil(activePlaylistList.value.length / 5))
)

const visiblePlaylists = computed(() => {
  const start = playlistPage.value * 5
  return activePlaylistList.value.slice(start, start + 5)
})

const newSongs = computed(() =>
  songs.filter((song) => song.isNew && matchRegion(song, activeNewRegion.value))
)

const chartGroups = computed(() => {
  const names = ['飙升榜', '热歌榜', '新歌榜']
  return names.map((name) => ({
    name,
    songs: songs.filter(
      (song) => song.chart === name && matchRegion(song, activeChartRegion.value)
    )
  }))
})

function matchRegion(song, region) {
  if (region === 'all') return true
  const target = regionAlias[region] || region
  return song.region === target
}

function pad(index) {
  return String(index + 1).padStart(2, '0')
}

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
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced || carouselPaused.value) return
  slideTimer = window.setInterval(nextSlide, 5000)
}

function stopTimer() {
  if (slideTimer) {
    window.clearInterval(slideTimer)
    slideTimer = null
  }
}

function toggleCarouselPause() {
  carouselPaused.value = !carouselPaused.value
  if (carouselPaused.value) {
    stopTimer()
  } else {
    startTimer()
  }
}

function onVisibilityChange() {
  if (document.hidden) {
    stopTimer()
  } else {
    startTimer()
  }
}

function selectPlaylistTab(key) {
  activePlaylistTab.value = key
  playlistPage.value = 0
}

function selectPlaylistPage(index) {
  playlistPage.value = index
}

function goPlaylist(id) {
  router.push({ name: 'playlist', params: { id } })
}

function goRank(chart) {
  router.push({ name: 'rank', query: { chart } })
}

function playPlaylist(playlist) {
  const list = songs.filter((song) => playlist.songIds.includes(song.id))
  playerStore.playAll(list)
}

function playSong(song, list = [song]) {
  playerStore.playSong(song, list)
}

onMounted(() => {
  startTimer()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  stopTimer()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <div class="main">
    <div class="cont1">
      <div class="cont-title">精彩推荐</div>
      <div
        class="cont1-shell"
        @mouseenter="stopTimer"
        @mouseleave="startTimer"
        @focusin="stopTimer"
        @focusout="startTimer"
      >
        <div class="carousel">
          <Transition name="carousel-fade" mode="out-in">
            <img
              :key="activeSlide"
              class="carousel-img"
              :src="slides[activeSlide].src"
              :alt="slides[activeSlide].alt"
              decoding="async"
            />
          </Transition>
        </div>
        <ul class="cont1-point">
          <li
            v-for="(slide, index) in slides"
            :key="slide.src"
            :class="{ active: activeSlide === index }"
            role="button"
            tabindex="0"
            :aria-label="`切换到第 ${index + 1} 张`"
            :aria-current="activeSlide === index ? 'true' : undefined"
            @click="goTo(index)"
            @keydown.enter.space.prevent="goTo(index)"
          ></li>
        </ul>
        <div class="cont1-button">
          <button class="cont1-button-left" type="button" aria-label="上一张" title="上一张" @click="previousSlide">
            <Icon name="chevron-left" :size="30" />
          </button>
          <button class="cont1-button-right" type="button" aria-label="下一张" title="下一张" @click="nextSlide">
            <Icon name="chevron-right" :size="30" />
          </button>
        </div>
        <button
          class="carousel-pause"
          type="button"
          :aria-label="carouselPaused ? '继续轮播' : '暂停轮播'"
          :title="carouselPaused ? '继续轮播' : '暂停轮播'"
          @click="toggleCarouselPause"
        >
          <Icon :name="carouselPaused ? 'play' : 'pause'" :size="18" />
        </button>
      </div>
    </div>

    <div class="cont2">
      <div class="cont-title">歌单推荐</div>
      <div class="cont-list c2-list" role="tablist" aria-label="歌单分类">
        <div
          v-for="tab in homePlaylistTabs"
          :key="tab.key"
          class="cont2-L"
          :class="{ 'c2-L': activePlaylistTab === tab.key }"
          role="tab"
          tabindex="0"
          :aria-selected="activePlaylistTab === tab.key"
          @click="selectPlaylistTab(tab.key)"
          @keydown.enter.space.prevent="selectPlaylistTab(tab.key)"
        >{{ tab.label }}</div>
      </div>
      <RouterLink to="/category">
        <div class="cont-more cont2-more">更多 &gt;&gt;</div>
      </RouterLink>

      <Transition name="section-fade" mode="out-in">
        <div :key="`${activePlaylistTab}-${playlistPage}`" class="cont2-areas">
          <div v-for="playlist in visiblePlaylists" :key="playlist.id" class="cont2-area">
            <div class="cont2-shell" @click="goPlaylist(playlist.id)">
              <img class="cont2-img" :src="playlist.cover" :alt="playlist.title" loading="lazy" decoding="async" />
              <div class="cont2-shadow"></div>
              <a class="cont2-play_list" href="javascript:;" @click.stop.prevent="playPlaylist(playlist)">
                <div class="cont2-play" title="播放"></div>
              </a>
            </div>
            <div class="cont2-word" @click="goPlaylist(playlist.id)">
              <p>{{ playlist.title }}</p>
              <p>{{ playlist.description }}</p>
            </div>
          </div>
        </div>
      </Transition>

      <div v-if="playlistPageCount > 1" class="cont-point c2-point" role="tablist" aria-label="歌单分页">
        <div
          v-for="index in playlistPageCount"
          :key="index"
          class="cont-pt"
          :class="{ 'c-pt': playlistPage === index - 1 }"
          role="tab"
          tabindex="0"
          :aria-selected="playlistPage === index - 1"
          :aria-label="`第 ${index} 页`"
          @click="selectPlaylistPage(index - 1)"
          @keydown.enter.space.prevent="selectPlaylistPage(index - 1)"
        ></div>
      </div>
    </div>

    <div class="cont3">
      <div class="cont-title">新歌首发</div>
      <div class="cont-list c3-list" role="tablist" aria-label="新歌地区">
        <div
          v-for="tab in regionTabs"
          :key="tab.key"
          class="cont3-L"
          :class="{ 'c3-L': activeNewRegion === tab.key }"
          role="tab"
          tabindex="0"
          :aria-selected="activeNewRegion === tab.key"
          @click="activeNewRegion = tab.key"
          @keydown.enter.space.prevent="activeNewRegion = tab.key"
        >{{ tab.label }}</div>
      </div>
      <RouterLink to="/album">
        <div class="cont-more cont3-more">更多 &gt;&gt;</div>
      </RouterLink>

      <Transition name="section-fade" mode="out-in">
        <div :key="activeNewRegion" class="cont3-songs">
          <template v-if="newSongs.length">
            <div v-for="song in newSongs" :key="song.id" class="cont3-song">
              <div class="cont3-shell" @click="playSong(song, newSongs)">
                <img class="cont3-img" :src="song.cover" :alt="song.title" loading="lazy" decoding="async" />
                <div class="cont3-shadow"></div>
                <div class="cont3-back">
                  <img
                    class="cont3-play"
                    :src="currentPlaying?.id === song.id && playerStore.isPlaying ? '/assets/imgs/media/pause.png' : '/assets/imgs/media/play.png'"
                    alt="播放"
                  />
                </div>
              </div>
              <div class="cont3-word">
                <div class="cont3-song_name">{{ song.title }}</div>
                <div class="cont3-song_singer">{{ song.artist }}</div>
              </div>
              <div class="cont3-song_time">{{ song.duration }}</div>
            </div>
          </template>
          <div v-else class="cont3-empty">暂无相关新歌</div>
        </div>
      </Transition>
    </div>

    <div class="cont4">
      <div class="cont-title">排行榜</div>
      <div class="cont-list c4-list" role="tablist" aria-label="榜单地区">
        <div
          v-for="tab in regionTabs"
          :key="tab.key"
          class="cont4-L"
          :class="{ 'c4-L': activeChartRegion === tab.key }"
          role="tab"
          tabindex="0"
          :aria-selected="activeChartRegion === tab.key"
          @click="activeChartRegion = tab.key"
          @keydown.enter.space.prevent="activeChartRegion = tab.key"
        >{{ tab.label }}</div>
      </div>
      <RouterLink to="/rank">
        <div class="cont-more cont4-more">更多 &gt;&gt;</div>
      </RouterLink>

      <Transition name="section-fade" mode="out-in">
        <div :key="activeChartRegion" class="cont4-charts">
          <div
            v-for="(group, index) in chartGroups"
            :key="group.name"
            class="cont4-chart"
            :class="`chart${index + 1}`"
          >
            <div class="cont4-chart_title" style="cursor:pointer" title="查看完整榜单" @click="goRank(group.name)">{{ group.name }}</div>
            <div class="cont4-chart_line"></div>
            <div class="cont4-chart_play_back" @click="group.songs.length && playSong(group.songs[0], group.songs)">
              <img src="/assets/imgs/media/play.png" class="cont4-chart_play" alt="播放" />
            </div>
            <div class="cont4-chart_list">
              <template v-if="group.songs.length">
                <div
                  v-for="(song, songIndex) in group.songs.slice(0, 3)"
                  :key="song.id"
                  class="cont4-chart_song"
                  @click="playSong(song, group.songs)"
                >
                  <div class="cont4-chart_song_num">{{ pad(songIndex) }}</div>
                  <div class="cont4-chart_song_meg">
                    <div class="cont4-chart_song_name">{{ song.title }}</div>
                    <div class="cont4-chart_song_singer">{{ song.artist }}</div>
                  </div>
                </div>
              </template>
              <div v-else class="cont4-empty">暂无相关歌曲</div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div class="footer">
      <div class="footer-moreMeg">
        <a class="ft-download" href="#" @click.prevent="showNotice('下载客户端为演示功能，暂未开放')">
          <div class="footer-download">
            <p title="下载客户端">下载客户端</p>
          </div>
        </a>
        <p>相关信息：</p>
        <p>北华大学计算机科学技术学院 @1977-2099</p>
        <p>软件工程北华前端开发小组 · Vue 3 重构版</p>
        <p>违法和不良信息举报电话：6666-88888</p>
        <p>举报邮箱：xxx@qg.com</p>
        <p>音乐网站 | 服务条款 | 隐私政策 | 版权投诉指引 | 意见反馈</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-fade-enter-active,
.section-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.section-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.section-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.carousel-pause {
  position: absolute;
  right: 16px;
  bottom: 12px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 34px;
  height: 30px;
  border: 1px solid rgb(255 179 199 / 95%);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--text);
  cursor: pointer;
}

.carousel-pause:hover {
  background: rgba(255, 255, 255, 0.9);
  color: var(--brand-strong);
}

.cont3-empty,
.cont4-empty {
  width: 100%;
  padding: 24px 0;
  color: var(--text-secondary);
  text-align: center;
}

.cont4-empty {
  color: rgba(255, 255, 255, 0.9);
}
</style>
