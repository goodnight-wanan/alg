<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { categories, getPlaylistSongs, playlists } from '../data/musicData'
import { usePageCss } from '../utils/pageCss'

usePageCss(['/assets/css/歌单分类.css'])

const router = useRouter()
const keyword = ref('')
const filters = reactive({
  genre: '',
  mood: '',
  era: '',
  region: ''
})

const filteredPlaylists = computed(() => {
  const word = keyword.value.trim().toLowerCase()

  return playlists.filter((playlist) => {
    const songs = getPlaylistSongs(playlist)
    const regions = new Set(songs.map((song) => song.region).filter(Boolean))

    const matchGenre = !filters.genre || playlist.genre === filters.genre
    const matchMood = !filters.mood || playlist.mood === filters.mood
    const matchEra = !filters.era || playlist.era === filters.era
    const matchRegion = !filters.region || regions.has(filters.region)
    const matchKeyword =
      !word ||
      playlist.title.toLowerCase().includes(word) ||
      playlist.description.toLowerCase().includes(word)

    return matchGenre && matchMood && matchEra && matchRegion && matchKeyword
  })
})

function setFilter(key, value) {
  filters[key] = filters[key] === value ? '' : value
}

function openPlaylist(id) {
  router.push({ name: 'playlist', params: { id } })
}
</script>

<template>
  <div class="mybody">
    <div class="title">
      <table>
        <tr>
          <td>
            <h3>歌单分类</h3>
          </td>
          <td>
            <input v-model="keyword" type="text" class="search" placeholder="请输入关键字" />
          </td>
        </tr>
      </table>
    </div>

    <div class="header">
      <table class="table">
        <tr>
          <td>
            <h4>类型:</h4>
          </td>
          <td>
            <a
              v-for="option in categories.genres"
              :key="option"
              href="javascript:;"
              class="name"
              @click.prevent="setFilter('genre', option)"
            >{{ option }}</a>
          </td>
        </tr>
        <tr>
          <td>
            <h4>心情:</h4>
          </td>
          <td>
            <a
              v-for="option in categories.moods"
              :key="option"
              href="javascript:;"
              class="name"
              @click.prevent="setFilter('mood', option)"
            >{{ option }}</a>
          </td>
        </tr>
        <tr>
          <td>
            <h4>年代:</h4>
          </td>
          <td>
            <a
              v-for="option in categories.eras"
              :key="option"
              href="javascript:;"
              class="name"
              @click.prevent="setFilter('era', option)"
            >{{ option }}</a>
          </td>
        </tr>
        <tr>
          <td>
            <h4>地区:</h4>
          </td>
          <td>
            <a
              v-for="option in categories.regions"
              :key="option"
              href="javascript:;"
              class="name"
              @click.prevent="setFilter('region', option)"
            >{{ option }}</a>
          </td>
        </tr>
      </table>
    </div>

    <div class="header1"></div>

    <div class="content">
      <div v-for="playlist in filteredPlaylists" :key="playlist.id" class="song-sheet">
        <div class="song-sheet_picture" @click="openPlaylist(playlist.id)">
          <img :src="playlist.cover" width="160px" height="160px" :alt="playlist.title" />
        </div>
        <div class="song-sheet_name">
          <a href="javascript:;" class="name1" @click.prevent="openPlaylist(playlist.id)">
            {{ playlist.title }}
          </a>
        </div>
      </div>

      <div v-if="!filteredPlaylists.length" class="no-result">没有找到符合条件的歌单</div>
    </div>
  </div>
</template>
