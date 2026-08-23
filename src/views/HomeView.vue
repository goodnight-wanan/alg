<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { playlists, songs } from '../data/musicData'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { usePageCss } from '../utils/pageCss'
import { openAuthWindow } from '../utils/openAuthWindow'

usePageCss(['/assets/css/style.css'])

const router = useRouter()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const keyword = ref('')
const activeSlide = ref(0)
let slideTimer = null
const notice = ref('')
let noticeTimer = null

const slides = [
  '/assets/imgs/homepage/carousel/carousel1.jpg',
  '/assets/imgs/homepage/carousel/carousel2.jpg',
  '/assets/imgs/homepage/carousel/carousel3.jpg',
  '/assets/imgs/homepage/carousel/carousel4.jpg'
]

const recommendedPlaylists = playlists.slice(0, 5)
const newSongs = songs.filter((song) => song.isNew)
const chartGroups = [
  { name: '飙升榜', songs: songs.filter((song) => song.chart === '飙升榜').slice(0, 3) },
  { name: '热歌榜', songs: songs.filter((song) => song.chart === '热歌榜').slice(0, 3) },
  { name: '新歌榜', songs: songs.filter((song) => song.chart === '新歌榜').slice(0, 3) }
]

const currentPlaying = computed(() => playerStore.currentSong)

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
  slideTimer = window.setInterval(nextSlide, 5000)
}

function stopTimer() {
  if (slideTimer) {
    window.clearInterval(slideTimer)
    slideTimer = null
  }
}

function showNotice(message) {
  notice.value = message
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => {
    notice.value = ''
  }, 2200)
}

function submitSearch() {
  const value = keyword.value.trim()
  if (!value) return
  router.push({ name: 'search', query: { q: value } })
  keyword.value = ''
}

function goPlaylist(id) {
  router.push({ name: 'playlist', params: { id } })
}

function playPlaylist(playlist) {
  const list = songs.filter((song) => playlist.songIds.includes(song.id))
  if (list.length) {
    playerStore.playSong(list[0], list)
  }
}

function playSong(song, list = [song]) {
  playerStore.playSong(song, list)
}

onMounted(startTimer)
onUnmounted(() => {
  stopTimer()
  window.clearTimeout(noticeTimer)
})
</script>

<template>
  <div class="main">
    <Transition name="notice">
      <div v-if="notice" class="page-notice">{{ notice }}</div>
    </Transition>
    <div class="header">
      <div class="header-top">
        <div class="header-logo">悦音音乐</div>
        <div class="header-column">
          <div class="header-col music-hall" @click="router.push('/')">音乐馆</div>
          <a
            v-if="!userStore.isLoggedIn"
            class="header-col my_music"
            href="#/login"
            @click.prevent="openAuthWindow()"
          >我的音乐</a>
          <div v-else class="header-col my_music" @click="router.push('/mine')">我的音乐</div>
          <div class="header-col download" @click="showNotice('客户端为演示功能，暂未开放')">客户端</div>
          <div class="header-col vip" @click="showNotice('VIP 为演示功能，暂未开放')">VIP</div>
        </div>
        <form class="header-seek" @submit.prevent="submitSearch">
          <input v-model="keyword" class="header-search" type="text" placeholder="搜索歌曲、歌单、歌手" />
          <button class="header-button" type="submit" title="搜索">⌕</button>
        </form>
        <div class="login" title="账号登录">
          <RouterLink v-if="userStore.isLoggedIn" class="user-avatar" to="/profile" :title="userStore.currentUser.username">
            {{ userStore.currentUser.username?.charAt(0).toUpperCase() || '?' }}
          </RouterLink>
          <a v-else class="a_login" href="#/login" @click.prevent="openAuthWindow()">登录</a>
        </div>
      </div>
      <div class="header-line"></div>
      <div class="header-menu">
        <a href="javascript:;" @click.prevent="router.push('/')">
          <div class="header-mn homepage">主页</div>
        </a>
        <a href="#" @click.prevent="showNotice('歌手功能暂未开放')"><div class="header-mn singer">歌手</div></a>
        <a href="#" @click.prevent="showNotice('新碟功能暂未开放')"><div class="header-mn newCD">新碟</div></a>
        <a href="javascript:;" @click.prevent="router.push('/search?tab=song')">
          <div class="header-mn chart">排行榜</div>
        </a>
        <a href="javascript:;" @click.prevent="router.push('/category')">
          <div class="header-mn sort_list">分类歌单</div>
        </a>
      </div>
    </div>

    <div class="cont1">
      <div class="cont-title">精彩推荐</div>
      <div class="cont1-shell" @mouseenter="stopTimer" @mouseleave="startTimer">
        <div class="carousel">
          <Transition name="carousel-fade" mode="out-in">
            <img :key="activeSlide" class="carousel-img" :src="slides[activeSlide]" alt="精彩推荐" />
          </Transition>
        </div>
        <ul class="cont1-point">
          <li
            v-for="(slide, index) in slides"
            :key="slide"
            :class="{ active: activeSlide === index }"
            @click="goTo(index)"
          ></li>
        </ul>
        <div class="cont1-button">
          <button class="cont1-button-left" type="button" @click="previousSlide">&lt;</button>
          <button class="cont1-button-right" type="button" @click="nextSlide">&gt;</button>
        </div>
      </div>
    </div>

    <div class="cont2">
      <div class="cont-title">歌单推荐</div>
      <div class="cont-list c2-list">
        <div class="cont2-L c2-L">为你推荐</div>
        <div class="cont2-L">网络歌曲</div>
        <div class="cont2-L">情歌</div>
        <div class="cont2-L">节奏歌曲</div>
        <div class="cont2-L">经典歌曲</div>
      </div>
      <RouterLink to="/category">
        <div class="cont-more cont2-more">更多 &gt;&gt;</div>
      </RouterLink>
      <div class="cont2-areas">
        <div v-for="playlist in recommendedPlaylists" :key="playlist.id" class="cont2-area">
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
      <div class="cont-point c2-point">
        <div class="cont-pt c-pt"></div>
        <div class="cont-pt"></div>
        <div class="cont-pt"></div>
        <div class="cont-pt"></div>
      </div>
    </div>

    <div class="cont3">
      <div class="cont-title">新歌首发</div>
      <div class="cont-list c3-list">
        <div class="cont3-L c3-L">最新</div>
        <div class="cont3-L">内地</div>
        <div class="cont3-L">港台</div>
        <div class="cont3-L">欧美</div>
        <div class="cont3-L">韩国</div>
        <div class="cont3-L">日本</div>
      </div>
      <RouterLink to="/search?tab=song">
        <div class="cont-more cont3-more">更多 &gt;&gt;</div>
      </RouterLink>
      <div class="cont3-songs">
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
      </div>
    </div>

    <div class="cont4">
      <div class="cont-title">排行榜</div>
      <div class="cont-list c4-list">
        <div class="cont4-L c4-L">最新</div>
        <div class="cont4-L">内地</div>
        <div class="cont4-L">港台</div>
        <div class="cont4-L">欧美</div>
        <div class="cont4-L">韩国</div>
        <div class="cont4-L">日本</div>
      </div>
      <div class="cont4-charts">
        <div
          v-for="(group, index) in chartGroups"
          :key="group.name"
          class="cont4-chart"
          :class="`chart${index + 1}`"
        >
          <div class="cont4-chart_title">{{ group.name }}</div>
          <div class="cont4-chart_line"></div>
          <div class="cont4-chart_play_back" @click="playSong(group.songs[0], group.songs)">
            <img src="/assets/imgs/media/play.png" class="cont4-chart_play" alt="播放" />
          </div>
          <div class="cont4-chart_list">
            <div
              v-for="(song, songIndex) in group.songs"
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
          </div>
        </div>
      </div>
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
.page-notice {
  position: fixed;
  top: 18px;
  left: 50%;
  z-index: 2000;
  padding: 12px 22px;
  border-radius: 999px;
  background: rgb(25 25 25 / 88%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
  transform: translateX(-50%);
}

.notice-enter-active,
.notice-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
