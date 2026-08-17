<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getPlaylistById, getPlaylistSongs } from '../data/musicData'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { usePageCss } from '../utils/pageCss'

usePageCss(['/assets/css/歌单页面.css'])

const route = useRoute()
const playerStore = usePlayerStore()
const userStore = useUserStore()

const playlist = computed(() => getPlaylistById(route.params.id))
const songs = computed(() => getPlaylistSongs(playlist.value))
const localSongs = ref(songs.value.map((song) => ({ ...song, fileName: `${song.title}.mp3` })))
const newSong = reactive({ name: '', artist: '', album: '' })
const selectedFile = ref(null)

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] || null
}

function addSong() {
  if (!newSong.name || !newSong.artist || !newSong.album) {
    alert('请输入完整歌曲的信息！')
    return
  }

  const audioUrl = selectedFile.value
    ? URL.createObjectURL(selectedFile.value)
    : '/assets/music/SWIN-S - 只因你太美.mp3'

  localSongs.value.push({
    id: `local-${Date.now()}`,
    title: newSong.name,
    artist: newSong.artist,
    album: newSong.album,
    cover: playlist.value?.cover || '',
    audio: audioUrl,
    duration: '--:--',
    fileName: selectedFile.value?.name || `${newSong.name}.mp3`
  })

  newSong.name = ''
  newSong.artist = ''
  newSong.album = ''
  selectedFile.value = null
}

function removeSong(index) {
  localSongs.value.splice(index, 1)
}

function playSong(song) {
  userStore.recordPlay(song.id)
  playerStore.playSong(song, localSongs.value)
}
</script>

<template>
  <div v-if="playlist" class="mybody">
    <div class="head">
      <table border="1px" style="height: 200px; width: 1200px">
        <tr>
          <td rowspan="3" colspan="1">
            <img :src="playlist.cover" width="180px" height="180px" :alt="playlist.title" />
          </td>
          <td>名称：{{ playlist.title }}</td>
        </tr>
        <tr>
          <td>分类：{{ playlist.genre }} / {{ playlist.mood }} / {{ playlist.era }}</td>
        </tr>
        <tr>
          <td>介绍：{{ playlist.description }}</td>
        </tr>
      </table>
    </div>

    <div class="content">
      <div>
        请输入歌曲名：<input v-model.trim="newSong.name" type="text" id="uname" /><br />
        请输入演唱者：<input v-model.trim="newSong.artist" type="text" id="singer" /><br />
        请输入专辑名：<input v-model.trim="newSong.album" type="text" id="time" /><br />
        请选择MP3文件：<input type="file" id="file" @change="onFileChange" />
      </div>

      <input type="button" value="添加" id="btn" @click="addSong" />

      <table border="1" cellspacing="1" cellpadding="0" id="tbd">
        <thead>
          <tr>
            <th>歌曲名</th>
            <th>演唱者</th>
            <th>专辑名</th>
            <th>MP3文件</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(song, index) in localSongs" :key="song.id">
            <td>{{ song.title }}</td>
            <td>{{ song.artist }}</td>
            <td>{{ song.album }}</td>
            <td>
              <a href="javascript:;" @click.prevent="playSong(song)">{{ song.fileName }}</a>
              <a href="javascript:;" @click.prevent="removeSong(index)">删除</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-else class="functional-page">
    <div class="functional-empty">歌单不存在或已被删除</div>
  </div>
</template>
