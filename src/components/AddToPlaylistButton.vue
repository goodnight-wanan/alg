<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSongById } from '../data/catalogData'
import { useUserStore } from '../stores/user'
import { openAuthWindow } from '../utils/authWindow'
import { showNotice } from '../utils/notice'

const props = defineProps({
  song: { type: Object, required: true },
  compact: { type: Boolean, default: false }
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const open = ref(false)
const playlistName = ref('')
const error = ref('')
const nameInput = ref(null)

const playlists = computed(() =>
  userStore.customPlaylists.map((playlist) => ({
    ...playlist,
    cover: getSongById(playlist.songIds.at(-1))?.cover || props.song.cover
  }))
)

function openDialog() {
  if (!userStore.isLoggedIn) {
    showNotice('请先登录后添加到歌单')
    openAuthWindow(router, 'login', route.fullPath)
    return
  }

  error.value = ''
  playlistName.value = ''
  open.value = true
  nextTick(() => {
    if (!playlists.value.length) nameInput.value?.focus()
  })
}

function closeDialog() {
  open.value = false
  error.value = ''
}

async function addToPlaylist(playlist) {
  const result = await userStore.addSongToCustomPlaylist(playlist.id, props.song.id)
  showNotice(result.message, result.ok ? 'success' : result.duplicate ? 'info' : 'error')
  if (result.ok) closeDialog()
}

async function createAndAdd() {
  const result = await userStore.createCustomPlaylist(playlistName.value, props.song.id)
  if (!result.ok) {
    error.value = result.message
    return
  }
  showNotice(result.message, 'success')
  closeDialog()
}

watch(open, (value) => document.body.classList.toggle('modal-open', value))
onBeforeUnmount(() => document.body.classList.remove('modal-open'))
</script>

<template>
  <button
    type="button"
    class="add-to-playlist-trigger"
    :class="{ 'is-compact': compact }"
    title="添加到我的歌单"
    aria-label="添加到我的歌单"
    @click.stop="openDialog"
  >
    <Icon name="list" :size="compact ? 18 : 16" />
  </button>

  <Teleport to="body">
    <Transition name="playlist-dialog">
      <div v-if="open" class="playlist-dialog-backdrop" @click="closeDialog">
        <section
          class="playlist-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="playlist-dialog-title"
          @click.stop
        >
          <header class="playlist-dialog-head">
            <div>
              <h2 id="playlist-dialog-title">添加到我的歌单</h2>
              <p>{{ song.title }} · {{ song.artist }}</p>
            </div>
            <button type="button" aria-label="关闭" @click="closeDialog">
              <Icon name="close" :size="18" />
            </button>
          </header>

          <div v-if="playlists.length" class="playlist-dialog-list">
            <button
              v-for="playlist in playlists"
              :key="playlist.id"
              type="button"
              class="playlist-dialog-item"
              @click="addToPlaylist(playlist)"
            >
              <img :src="playlist.cover" :alt="playlist.name" />
              <span>
                <strong>{{ playlist.name }}</strong>
                <small>{{ playlist.songIds.length }} 首歌曲</small>
              </span>
              <Icon name="list" :size="18" />
            </button>
          </div>
          <p v-else class="playlist-dialog-empty">还没有自己的歌单，请先创建一个。</p>

          <form class="playlist-create-form" @submit.prevent="createAndAdd">
            <label for="new-playlist-name">新建歌单</label>
            <div>
              <input
                id="new-playlist-name"
                ref="nameInput"
                v-model.trim="playlistName"
                type="text"
                maxlength="30"
                placeholder="输入歌单名称"
              />
              <button type="submit">创建并添加</button>
            </div>
            <p v-if="error" class="playlist-dialog-error">{{ error }}</p>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.add-to-playlist-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  transition: color 0.18s ease;
}
.add-to-playlist-trigger:hover {
  color: var(--brand-strong);
}
.add-to-playlist-trigger.is-compact {
  width: 40px;
  height: 40px;
  min-height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
}
.add-to-playlist-trigger.is-compact:hover {
  color: var(--brand-strong);
}
.playlist-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(25, 21, 22, 0.42);
  backdrop-filter: blur(4px);
}
.playlist-dialog {
  width: min(460px, 100%);
  max-height: min(680px, calc(100vh - 40px));
  overflow: auto;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 18px;
  background: #fff8fb;
  box-shadow: 0 24px 70px rgba(86, 35, 58, 0.24);
}
.playlist-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.playlist-dialog-head h2,
.playlist-dialog-head p {
  margin: 0;
}
.playlist-dialog-head h2 {
  font-size: 20px;
}
.playlist-dialog-head p {
  margin-top: 5px;
  color: var(--text-secondary);
  font-size: 13px;
}
.playlist-dialog-head > button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary);
}
.playlist-dialog-list {
  display: grid;
  gap: 8px;
  max-height: 280px;
  margin: 20px 0;
  overflow: auto;
}
.playlist-dialog-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text);
  text-align: left;
}
.playlist-dialog-item:hover {
  background: rgba(255, 126, 179, 0.13);
}
.playlist-dialog-item img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}
.playlist-dialog-item span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.playlist-dialog-item strong,
.playlist-dialog-item small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.playlist-dialog-item small,
.playlist-dialog-empty {
  color: var(--text-secondary);
}
.playlist-dialog-empty {
  margin: 20px 0;
  padding: 18px;
  border-radius: 10px;
  background: rgba(255, 126, 179, 0.08);
  text-align: center;
}
.playlist-create-form {
  padding-top: 18px;
  border-top: 1px solid rgba(25, 25, 25, 0.08);
}
.playlist-create-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 800;
}
.playlist-create-form > div {
  display: flex;
  gap: 8px;
}
.playlist-create-form input {
  min-width: 0;
  height: 42px;
  flex: 1;
  padding: 0 12px;
  border: 1px solid rgba(25, 25, 25, 0.14);
  border-radius: 9px;
  outline: none;
}
.playlist-create-form input:focus {
  border-color: var(--brand-strong);
  box-shadow: 0 0 0 3px rgba(233, 78, 119, 0.12);
}
.playlist-create-form button {
  padding: 0 16px;
  border-radius: 9px;
  background: var(--brand-strong);
  color: #fff;
  font-weight: 800;
}
.playlist-dialog-error {
  margin: 8px 0 0;
  color: #c5354e;
  font-size: 13px;
  font-weight: 700;
}
.playlist-dialog-enter-active,
.playlist-dialog-leave-active {
  transition: opacity 0.18s ease;
}
.playlist-dialog-enter-from,
.playlist-dialog-leave-to {
  opacity: 0;
}
@media (max-width: 560px) {
  .playlist-create-form > div {
    flex-direction: column;
  }
  .playlist-create-form button {
    height: 42px;
  }
}
</style>
