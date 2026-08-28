<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { API_BASE_URL } from '../api'
import { useAdminAuthStore } from '../auth'

const auth = useAdminAuthStore()
const songs = ref([])
const artists = ref([])
const albums = ref([])
const categories = ref([])
const selectedIds = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const totalPages = ref(1)

const artistForm = reactive({ name: '', biography: '' })
const categoryForm = reactive({ name: '', slug: '', description: '' })
const albumForm = reactive({ title: '', artistId: '', releaseDate: '', description: '' })
const remoteForm = reactive({
  title: '',
  artistId: '',
  albumId: '',
  remoteUrl: '',
  categoryIds: [],
  status: 'DRAFT'
})
const uploadForm = reactive({
  title: '',
  artistId: '',
  albumId: '',
  categoryIds: [],
  status: 'DRAFT',
  audio: null,
  cover: null
})

const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin
const allSelected = computed(
  () => songs.value.length > 0 && selectedIds.value.length === songs.value.length
)

function showNotice(message) {
  notice.value = message
  error.value = ''
}

function showError(requestError) {
  error.value = requestError.message || '操作失败'
  notice.value = ''
}

async function loadReferenceData() {
  const [artistData, albumData, categoryData] = await Promise.all([
    auth.request('/artists'),
    auth.request('/albums'),
    auth.request('/categories')
  ])
  artists.value = artistData
  albums.value = albumData
  categories.value = categoryData
}

async function loadSongs() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: '20' })
    if (search.value.trim()) params.set('search', search.value.trim())
    if (statusFilter.value) params.set('status', statusFilter.value)
    const result = await auth.request(`/admin/songs?${params}`)
    songs.value = result.items
    totalPages.value = Math.max(1, result.pagination.totalPages)
    selectedIds.value = selectedIds.value.filter((id) => songs.value.some((song) => song.id === id))
  } catch (requestError) {
    showError(requestError)
  } finally {
    loading.value = false
  }
}

async function runSave(action) {
  saving.value = true
  error.value = ''
  try {
    await action()
  } catch (requestError) {
    showError(requestError)
  } finally {
    saving.value = false
  }
}

async function createArtist() {
  await runSave(async () => {
    await auth.request('/admin/artists', {
      method: 'POST',
      body: JSON.stringify(artistForm)
    })
    Object.assign(artistForm, { name: '', biography: '' })
    await loadReferenceData()
    showNotice('歌手创建成功')
  })
}

async function createCategory() {
  await runSave(async () => {
    await auth.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryForm)
    })
    Object.assign(categoryForm, { name: '', slug: '', description: '' })
    await loadReferenceData()
    showNotice('分类创建成功')
  })
}

async function createAlbum() {
  await runSave(async () => {
    const payload = { ...albumForm }
    if (!payload.releaseDate) delete payload.releaseDate
    if (!payload.description) delete payload.description
    await auth.request('/admin/albums', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    Object.assign(albumForm, { title: '', artistId: '', releaseDate: '', description: '' })
    await loadReferenceData()
    showNotice('专辑创建成功')
  })
}

async function createRemoteSong() {
  await runSave(async () => {
    const payload = {
      ...remoteForm,
      sourceType: 'REMOTE',
      categoryIds: [...remoteForm.categoryIds]
    }
    if (!payload.albumId) delete payload.albumId
    await auth.request('/admin/songs', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    Object.assign(remoteForm, {
      title: '',
      artistId: '',
      albumId: '',
      remoteUrl: '',
      categoryIds: [],
      status: 'DRAFT'
    })
    await loadSongs()
    showNotice('远程歌曲创建成功')
  })
}

async function uploadSong() {
  if (!uploadForm.audio) {
    showError(new Error('请选择音频文件'))
    return
  }
  await runSave(async () => {
    const formData = new FormData()
    formData.set('title', uploadForm.title)
    formData.set('artistId', uploadForm.artistId)
    formData.set('status', uploadForm.status)
    formData.set('categoryIds', JSON.stringify(uploadForm.categoryIds))
    if (uploadForm.albumId) formData.set('albumId', uploadForm.albumId)
    formData.set('audio', uploadForm.audio)
    if (uploadForm.cover) formData.set('cover', uploadForm.cover)
    await auth.request('/admin/songs/upload', { method: 'POST', body: formData })
    Object.assign(uploadForm, {
      title: '',
      artistId: '',
      albumId: '',
      categoryIds: [],
      status: 'DRAFT',
      audio: null,
      cover: null
    })
    const audioInput = document.querySelector('#audio-file')
    const coverInput = document.querySelector('#cover-file')
    if (audioInput) audioInput.value = ''
    if (coverInput) coverInput.value = ''
    await loadSongs()
    showNotice('本地歌曲上传并转码成功')
  })
}

async function editSong(song) {
  const title = window.prompt('修改歌曲名称', song.title)?.trim()
  if (!title || title === song.title) return
  await runSave(async () => {
    await auth.request(`/admin/songs/${song.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title })
    })
    await loadSongs()
    showNotice('歌曲信息已更新')
  })
}

async function setStatus(song, status) {
  await runSave(async () => {
    await auth.request(`/admin/songs/${song.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
    await loadSongs()
    showNotice(status === 'PUBLISHED' ? '歌曲已上架' : '歌曲已下架')
  })
}

async function deleteSong(song) {
  if (!window.confirm(`确定删除《${song.title}》及其上传文件吗？`)) return
  await runSave(async () => {
    await auth.request(`/admin/songs/${song.id}`, { method: 'DELETE' })
    selectedIds.value = selectedIds.value.filter((id) => id !== song.id)
    await loadSongs()
    showNotice('歌曲已删除')
  })
}

async function batchStatus(status) {
  if (!selectedIds.value.length) return
  await runSave(async () => {
    await auth.request('/admin/songs/batch/status', {
      method: 'PATCH',
      body: JSON.stringify({ ids: selectedIds.value, status })
    })
    await loadSongs()
    showNotice(`已批量${status === 'PUBLISHED' ? '上架' : '下架'}歌曲`)
  })
}

async function batchDelete() {
  if (!selectedIds.value.length || !window.confirm('确定删除所选歌曲及其上传文件吗？')) return
  await runSave(async () => {
    await auth.request('/admin/songs/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids: selectedIds.value })
    })
    selectedIds.value = []
    await loadSongs()
    showNotice('所选歌曲已删除')
  })
}

function toggleAll() {
  selectedIds.value = allSelected.value ? [] : songs.value.map((song) => song.id)
}

function applyFilters() {
  page.value = 1
  void loadSongs()
}

function previousPage() {
  if (page.value <= 1) return
  page.value -= 1
  void loadSongs()
}

function nextPage() {
  if (page.value >= totalPages.value) return
  page.value += 1
  void loadSongs()
}

function setAudioFile(event) {
  uploadForm.audio = event.target.files?.[0] || null
}

function setCoverFile(event) {
  uploadForm.cover = event.target.files?.[0] || null
}

function previewUrl(song) {
  return song.status === 'PUBLISHED' ? `${apiOrigin}${song.audioUrl}` : null
}

onMounted(async () => {
  try {
    await Promise.all([loadReferenceData(), loadSongs()])
  } catch (requestError) {
    showError(requestError)
  }
})
</script>

<template>
  <main class="dashboard">
    <section class="hero glass-panel">
      <div>
        <span class="eyebrow">CATALOG WORKSPACE</span>
        <h2>曲库管理</h2>
        <p>维护歌手与分类，上传本地音频或录入可信远程音频。</p>
      </div>
      <div class="hero-stat">
        <strong>{{ songs.length }}</strong
        ><span>当前页歌曲</span>
      </div>
    </section>

    <p v-if="notice" class="form-message success-message">{{ notice }}</p>
    <p v-if="error" class="form-message error-message">{{ error }}</p>

    <section class="metadata-grid">
      <form class="glass-panel compact-form" @submit.prevent="createArtist">
        <h3>新建歌手</h3>
        <input v-model.trim="artistForm.name" placeholder="歌手名称" required />
        <textarea v-model.trim="artistForm.biography" placeholder="简介（可选）"></textarea>
        <button class="secondary-button" :disabled="saving">保存歌手</button>
      </form>

      <form class="glass-panel compact-form" @submit.prevent="createCategory">
        <h3>新建分类</h3>
        <input v-model.trim="categoryForm.name" placeholder="分类名称" required />
        <input v-model.trim="categoryForm.slug" placeholder="英文别名，如 pop" required />
        <button class="secondary-button" :disabled="saving">保存分类</button>
      </form>

      <form class="glass-panel compact-form" @submit.prevent="createAlbum">
        <h3>新建专辑</h3>
        <input v-model.trim="albumForm.title" placeholder="专辑名称" required />
        <select v-model="albumForm.artistId" required>
          <option value="">选择歌手</option>
          <option v-for="artist in artists" :key="artist.id" :value="artist.id">
            {{ artist.name }}
          </option>
        </select>
        <input v-model="albumForm.releaseDate" type="date" />
        <button class="secondary-button" :disabled="saving">保存专辑</button>
      </form>
    </section>

    <section class="song-editor-grid">
      <form class="glass-panel song-form" @submit.prevent="uploadSong">
        <div class="section-heading">
          <div>
            <span class="eyebrow">LOCAL</span>
            <h3>上传本地歌曲</h3>
          </div>
          <span class="tag">自动转 MP3</span>
        </div>
        <input v-model.trim="uploadForm.title" placeholder="歌曲名称" required />
        <div class="form-row">
          <select v-model="uploadForm.artistId" required>
            <option value="">选择歌手</option>
            <option v-for="artist in artists" :key="artist.id" :value="artist.id">
              {{ artist.name }}
            </option>
          </select>
          <select v-model="uploadForm.albumId">
            <option value="">无专辑</option>
            <option
              v-for="album in albums.filter(
                (item) => !uploadForm.artistId || item.artist.id === uploadForm.artistId
              )"
              :key="album.id"
              :value="album.id"
            >
              {{ album.title }}
            </option>
          </select>
        </div>
        <select v-model="uploadForm.categoryIds" multiple>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <div class="form-row file-row">
          <label
            >音频<input
              id="audio-file"
              type="file"
              accept="audio/*,.flac,.m4a"
              required
              @change="setAudioFile"
          /></label>
          <label
            >封面<input id="cover-file" type="file" accept="image/*" @change="setCoverFile"
          /></label>
        </div>
        <select v-model="uploadForm.status">
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">立即上架</option>
        </select>
        <button class="primary-button" :disabled="saving">上传歌曲</button>
      </form>

      <form class="glass-panel song-form" @submit.prevent="createRemoteSong">
        <div class="section-heading">
          <div>
            <span class="eyebrow">REMOTE</span>
            <h3>录入远程歌曲</h3>
          </div>
          <span class="tag">白名单 URL</span>
        </div>
        <input v-model.trim="remoteForm.title" placeholder="歌曲名称" required />
        <div class="form-row">
          <select v-model="remoteForm.artistId" required>
            <option value="">选择歌手</option>
            <option v-for="artist in artists" :key="artist.id" :value="artist.id">
              {{ artist.name }}
            </option>
          </select>
          <select v-model="remoteForm.albumId">
            <option value="">无专辑</option>
            <option
              v-for="album in albums.filter(
                (item) => !remoteForm.artistId || item.artist.id === remoteForm.artistId
              )"
              :key="album.id"
              :value="album.id"
            >
              {{ album.title }}
            </option>
          </select>
        </div>
        <input
          v-model.trim="remoteForm.remoteUrl"
          type="url"
          placeholder="https://可信域名/audio.mp3"
          required
        />
        <select v-model="remoteForm.categoryIds" multiple>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <select v-model="remoteForm.status">
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">立即上架</option>
        </select>
        <button class="primary-button" :disabled="saving">创建远程歌曲</button>
      </form>
    </section>

    <section class="glass-panel table-panel">
      <div class="table-toolbar">
        <div>
          <span class="eyebrow">LIBRARY</span>
          <h3>歌曲列表</h3>
        </div>
        <div class="filters">
          <input v-model="search" placeholder="搜索歌曲、歌手或专辑" @keyup.enter="applyFilters" />
          <select v-model="statusFilter" @change="applyFilters">
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已上架</option>
            <option value="UNPUBLISHED">已下架</option>
          </select>
          <button class="secondary-button" type="button" @click="applyFilters">查询</button>
        </div>
      </div>
      <div class="batch-bar">
        <label
          ><input type="checkbox" :checked="allSelected" @change="toggleAll" /> 全选当前页</label
        >
        <button type="button" @click="batchStatus('PUBLISHED')">批量上架</button>
        <button type="button" @click="batchStatus('UNPUBLISHED')">批量下架</button>
        <button type="button" class="danger-button" @click="batchDelete">批量删除</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>歌曲</th>
              <th>来源</th>
              <th>状态</th>
              <th>试听</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="song in songs" :key="song.id">
              <td><input v-model="selectedIds" type="checkbox" :value="song.id" /></td>
              <td>
                <strong>{{ song.title }}</strong
                ><small>{{ song.artist.name }} · {{ song.album?.title || '单曲' }}</small>
              </td>
              <td>
                <span class="tag">{{ song.sourceType }}</span>
              </td>
              <td>
                <span :class="['status-dot', song.status.toLowerCase()]">{{ song.status }}</span>
              </td>
              <td>
                <audio
                  v-if="previewUrl(song)"
                  :src="previewUrl(song)"
                  controls
                  preload="none"
                ></audio
                ><small v-else>上架后可试听</small>
              </td>
              <td class="row-actions">
                <button type="button" @click="editSong(song)">编辑</button>
                <button
                  v-if="song.status !== 'PUBLISHED'"
                  type="button"
                  @click="setStatus(song, 'PUBLISHED')"
                >
                  上架
                </button>
                <button v-else type="button" @click="setStatus(song, 'UNPUBLISHED')">下架</button>
                <button type="button" class="danger-text" @click="deleteSong(song)">删除</button>
              </td>
            </tr>
            <tr v-if="!loading && !songs.length">
              <td colspan="6" class="empty-state">暂无歌曲，请先创建歌手并上传第一首音乐。</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button :disabled="page <= 1" @click="previousPage">上一页</button
        ><span>{{ page }} / {{ totalPages }}</span
        ><button :disabled="page >= totalPages" @click="nextPage">下一页</button>
      </div>
    </section>
  </main>
</template>
