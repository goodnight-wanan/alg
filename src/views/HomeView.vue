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
  { src: '/assets/imgs/homepage/carousel/carousel1.webp', alt: '悦音音乐推荐横幅一' },
  { src: '/assets/imgs/homepage/carousel/carousel2.webp', alt: '悦音音乐推荐横幅二' },
  { src: '/assets/imgs/homepage/carousel/carousel3.webp', alt: '悦音音乐推荐横幅三' },
  { src: '/assets/imgs/homepage/carousel/carousel4.webp', alt: '悦音音乐推荐横幅四' }
]

const regionTabs = [
  { key: 'all', label: '最新' },
  { key: '内地', label: '内地' },
  { key: '港台', label: '港台' },
  { key: '欧美', label: '欧美' },
  { key: '韩国', label: '韩国' },
  { key: '日本', label: '日本' }
]

const activePlaylistTab = ref(homePlaylistTabs[0].key)
const playlistPage = ref(0)
const songPage = ref(0)
const activeNewRegion = ref('all')
const activeChartRegion = ref('all')

const currentPlaying = computed(() => playerStore.currentSong)

function makePages(items, pageSize) {
  if (!items?.length) return []
  const pages = []
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize))
  }
  return pages
}

function onTabArrow(event, direction) {
  const current = event.currentTarget
  const items = Array.from(current.parentElement?.querySelectorAll('[role="tab"]') || [])
  const index = items.indexOf(current)
  if (index < 0) return
  const next = (index + direction + items.length) % items.length
  items[next]?.focus()
  items[next]?.click()
}

const activePlaylistList = computed(() => {
  const tab = homePlaylistTabs.find((item) => item.key === activePlaylistTab.value)
  return (tab?.ids || [])
    .map((id) => playlists.find((playlist) => playlist.id === id))
    .filter(Boolean)
})

const playlistPages = computed(() => makePages(activePlaylistList.value, 5))
const visiblePlaylists = computed(() => playlistPages.value[playlistPage.value] || [])

const newRegionSongs = computed(() => {
  if (activeNewRegion.value === 'all') return songs.filter((song) => song.isNew)
  return songs.filter((song) => song.isNew && song.region === activeNewRegion.value)
})

const newSongPages = computed(() => makePages(newRegionSongs.value, 6).slice(0, 4))
const visibleNewSongs = computed(() => newSongPages.value[songPage.value] || [])

const chartNames = ['飙升榜', '热歌榜', '新歌榜']

const chartSongsByRegion = computed(() => {
  if (activeChartRegion.value === 'all') return songs
  return songs.filter((song) => song.region === activeChartRegion.value)
})

const chartGroups = computed(() =>
  chartNames.map((name) => {
    const list = chartSongsByRegion.value.filter((song) => song.chart === name)
    return { name, songs: list.slice(0, 3) }
  })
)

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

function setRegion(region, target) {
  if (target === 'new') {
    activeNewRegion.value = region
    songPage.value = 0
  } else {
    activeChartRegion.value = region
  }
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

function playNewSong(song) {
  playerStore.playSong(song, newRegionSongs.value)
}

function playChartSong(song, group) {
  const list = chartSongsByRegion.value.filter((item) => item.chart === group.name)
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
          <button
            class="cont1-button-left"
            type="button"
            aria-label="上一张"
            title="上一张"
            @click="previousSlide"
          >
            <Icon name="chevron-left" :size="30" />
          </button>
          <button
            class="cont1-button-right"
            type="button"
            aria-label="下一张"
            title="下一张"
            @click="nextSlide"
          >
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
          :tabindex="activePlaylistTab === tab.key ? 0 : -1"
          :aria-selected="activePlaylistTab === tab.key"
          @click="selectPlaylistTab(tab.key)"
          @keydown.enter.space.prevent="selectPlaylistTab(tab.key)"
          @keydown.left.prevent="onTabArrow($event, -1)"
          @keydown.right.prevent="onTabArrow($event, 1)"
          @keydown.up.prevent="onTabArrow($event, -1)"
          @keydown.down.prevent="onTabArrow($event, 1)"
        >
          {{ tab.label }}
        </div>
      </div>
      <RouterLink to="/category">
        <div class="cont-more cont2-more">更多 &gt;&gt;</div>
      </RouterLink>

      <Transition name="section-fade" mode="out-in">
        <div :key="`${activePlaylistTab}-${playlistPage}`" class="cont2-areas">
          <div v-for="playlist in visiblePlaylists" :key="playlist.id" class="cont2-area">
            <div class="cont2-shell">
              <img
                class="cont2-img"
                :src="playlist.cover"
                :alt="playlist.title"
                loading="lazy"
                decoding="async"
              />
              <div class="cont2-shadow"></div>
              <button type="button" class="cont2-play_list" @click.stop="playPlaylist(playlist)">
                <div class="cont2-play" title="播放"></div>
              </button>
            </div>
            <div
              class="cont2-word"
              role="button"
              tabindex="0"
              @click="goPlaylist(playlist.id)"
              @keydown.enter.space.prevent="goPlaylist(playlist.id)"
            >
              <p :title="playlist.title">{{ playlist.title }}</p>
              <p :title="playlist.description">{{ playlist.description }}</p>
            </div>
          </div>
        </div>
      </Transition>

      <div class="cont-point c2-point" role="tablist" aria-label="歌单分页">
        <div
          v-for="index in playlistPages.length"
          :key="index"
          class="cont-pt"
          :class="{ 'c-pt': playlistPage === index - 1 }"
          role="tab"
          :tabindex="playlistPage === index - 1 ? 0 : -1"
          :aria-selected="playlistPage === index - 1"
          :aria-label="`第 ${index} 页`"
          @click="playlistPage = index - 1"
          @keydown.enter.space.prevent="playlistPage = index - 1"
          @keydown.left.prevent="onTabArrow($event, -1)"
          @keydown.right.prevent="onTabArrow($event, 1)"
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
          :tabindex="activeNewRegion === tab.key ? 0 : -1"
          :aria-selected="activeNewRegion === tab.key"
          @click="setRegion(tab.key, 'new')"
          @keydown.enter.space.prevent="setRegion(tab.key, 'new')"
          @keydown.left.prevent="onTabArrow($event, -1)"
          @keydown.right.prevent="onTabArrow($event, 1)"
          @keydown.up.prevent="onTabArrow($event, -1)"
          @keydown.down.prevent="onTabArrow($event, 1)"
        >
          {{ tab.label }}
        </div>
      </div>
      <RouterLink to="/album">
        <div class="cont-more cont3-more">更多 &gt;&gt;</div>
      </RouterLink>

      <Transition name="section-fade" mode="out-in">
        <div :key="`${activeNewRegion}-${songPage}`" class="cont3-songs">
          <div v-for="song in visibleNewSongs" :key="song.id" class="cont3-song">
            <div
              class="cont3-shell"
              role="button"
              tabindex="0"
              @click="playNewSong(song)"
              @keydown.enter.space.prevent="playNewSong(song)"
            >
              <img
                class="cont3-img"
                :src="song.cover"
                :alt="song.title"
                loading="lazy"
                decoding="async"
              />
              <div class="cont3-shadow"></div>
              <div class="cont3-back">
                <img
                  class="cont3-play"
                  :src="
                    currentPlaying?.id === song.id && playerStore.isPlaying
                      ? '/assets/imgs/media/pause.png'
                      : '/assets/imgs/media/play.png'
                  "
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
        </div>
      </Transition>

      <div class="cont-point" role="tablist" aria-label="新歌分页">
        <div
          v-for="index in newSongPages.length"
          :key="index"
          class="cont-pt"
          :class="{ 'c-pt': songPage === index - 1 }"
          role="tab"
          :tabindex="songPage === index - 1 ? 0 : -1"
          :aria-selected="songPage === index - 1"
          :aria-label="`第 ${index} 页`"
          @click="songPage = index - 1"
          @keydown.enter.space.prevent="songPage = index - 1"
          @keydown.left.prevent="onTabArrow($event, -1)"
          @keydown.right.prevent="onTabArrow($event, 1)"
        ></div>
      </div>
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
          :tabindex="activeChartRegion === tab.key ? 0 : -1"
          :aria-selected="activeChartRegion === tab.key"
          @click="setRegion(tab.key, 'chart')"
          @keydown.enter.space.prevent="setRegion(tab.key, 'chart')"
          @keydown.left.prevent="onTabArrow($event, -1)"
          @keydown.right.prevent="onTabArrow($event, 1)"
          @keydown.up.prevent="onTabArrow($event, -1)"
          @keydown.down.prevent="onTabArrow($event, 1)"
        >
          {{ tab.label }}
        </div>
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
            <button
              type="button"
              class="cont4-chart_title"
              title="查看完整榜单"
              @click="goRank(group.name)"
            >
              {{ group.name }}
            </button>
            <div class="cont4-chart_line"></div>
            <div
              class="cont4-chart_play_back"
              role="button"
              tabindex="0"
              @click="group.songs.length && playChartSong(group.songs[0], group)"
              @keydown.enter.space.prevent="
                group.songs.length && playChartSong(group.songs[0], group)
              "
            >
              <img src="/assets/imgs/media/play.png" class="cont4-chart_play" alt="播放" />
            </div>
            <div class="cont4-chart_list">
              <div
                v-for="(song, songIndex) in group.songs"
                :key="song.id"
                class="cont4-chart_song"
                role="button"
                tabindex="0"
                @click="playChartSong(song, group)"
                @keydown.enter.space.prevent="playChartSong(song, group)"
              >
                <div class="cont4-chart_song_num">{{ pad(songIndex) }}</div>
                <div class="cont4-chart_song_meg">
                  <div class="cont4-chart_song_name">{{ song.title }}</div>
                  <div class="cont4-chart_song_singer">{{ song.artist }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div class="footer">
      <div class="footer-moreMeg">
        <a
          class="ft-download"
          href="#"
          @click.prevent="showNotice('下载客户端为演示功能，暂未开放')"
        >
          <div class="footer-download">
            <p title="下载客户端">下载客户端</p>
          </div>
        </a>
        <p>相关信息：</p>
        <p>北华大学计算机科学技术学院 @1977-2099</p>
        <p>软件工程北华前端开发小组 · Vue 3 重构版</p>
        <p>违法和不良信息举报电话：6666-88888</p>
        <p>举报邮箱：xxx@qg.com</p>
        <p class="footer-links">
          <span>音乐网站</span>
          <span class="footer-sep" aria-hidden="true">|</span>
          <a href="#" @click.prevent="showNotice('服务条款为演示内容，暂未开放')">服务条款</a>
          <span class="footer-sep" aria-hidden="true">|</span>
          <a href="#" @click.prevent="showNotice('隐私政策为演示内容，暂未开放')">隐私政策</a>
          <span class="footer-sep" aria-hidden="true">|</span>
          <a href="#" @click.prevent="showNotice('版权投诉指引为演示内容，暂未开放')"
            >版权投诉指引</a
          >
          <span class="footer-sep" aria-hidden="true">|</span>
          <a href="#" @click.prevent="showNotice('意见反馈为演示功能，暂未开放')">意见反馈</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-fade-enter-active,
.section-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
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
</style>
