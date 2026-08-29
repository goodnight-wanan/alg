<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { API_BASE_URL } from '../api'
import { useAdminAuthStore } from '../auth'
import CategoryTagPicker from '../components/CategoryTagPicker.vue'

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
const metadataTab = ref('artists')
const editingArtistId = ref('')
const editingCategoryId = ref('')

const artistForm = reactive({ name: '', region: '', biography: '', avatar: null })
const categoryForm = reactive({ name: '', slug: '', type: '', description: '' })
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

const artistAvatarPreview = ref('')
const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin
const allSelected = computed(
  () => songs.value.length > 0 && selectedIds.value.length === songs.value.length
)

const CATEGORY_TYPE_LABELS = {
  GENRE: '类型',
  MOOD: '心情',
  ERA: '年代',
  REGION: '地区',
  CHART: '榜单',
  FEATURE: '特色'
}
const SLUG_GROUP_PREFIXES = ['genre', 'mood', 'era', 'region', 'chart', 'feature']

function categoryGroup(category) {
  if (category.type) return category.type
  const prefix = String(category.slug || '').split('-')[0]
  const normalized = prefix.toLowerCase()
  return SLUG_GROUP_PREFIXES.includes(normalized) ? normalized.toUpperCase() : ''
}

function categoryGroupLabel(group) {
  return CATEGORY_TYPE_LABELS[group] || '未分组'
}

function typePrefix(type) {
  return String(type || '').toLowerCase()
}

const regionOptions = computed(() =>
  categories.value
    .filter((category) => categoryGroup(category) === 'REGION')
    .map((category) => category.name)
)

function assetUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${apiOrigin}${value}`
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

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

function clearArtistAvatarPreview() {
  if (artistAvatarPreview.value) URL.revokeObjectURL(artistAvatarPreview.value)
  artistAvatarPreview.value = ''
}

function resetArtistForm() {
  Object.assign(artistForm, { name: '', region: '', biography: '', avatar: null })
  clearArtistAvatarPreview()
  const avatarInput = document.querySelector('#artist-avatar-file')
  if (avatarInput) avatarInput.value = ''
}

function setArtistAvatar(event) {
  const file = event.target.files?.[0] || null
  artistForm.avatar = file
  if (artistAvatarPreview.value) URL.revokeObjectURL(artistAvatarPreview.value)
  artistAvatarPreview.value = file ? URL.createObjectURL(file) : ''
}

async function submitArtist() {
  const isEditing = Boolean(editingArtistId.value)
  await runSave(async () => {
    const formData = new FormData()
    formData.set('name', artistForm.name)
    if (artistForm.region || isEditing) formData.set('region', artistForm.region)
    if (artistForm.biography.trim() || isEditing) {
      formData.set('biography', artistForm.biography.trim())
    }
    if (artistForm.avatar) formData.set('avatar', artistForm.avatar)

    const path = isEditing ? `/admin/artists/${editingArtistId.value}` : '/admin/artists'
    await auth.request(path, {
      method: isEditing ? 'PATCH' : 'POST',
      body: formData
    })
    editingArtistId.value = ''
    resetArtistForm()
    await loadReferenceData()
    showNotice(isEditing ? '歌手信息已更新' : '歌手创建成功')
  })
}

function startArtistEdit(artist) {
  editingArtistId.value = artist.id
  Object.assign(artistForm, {
    name: artist.name,
    region: artist.region || '',
    biography: artist.biography || '',
    avatar: null
  })
  clearArtistAvatarPreview()
  const avatarInput = document.querySelector('#artist-avatar-file')
  if (avatarInput) avatarInput.value = ''
}

function cancelArtistEdit() {
  editingArtistId.value = ''
  resetArtistForm()
}

async function deleteArtist(artist) {
  if (!window.confirm(`确定删除歌手「${artist.name}」吗？`)) return
  await runSave(async () => {
    await auth.request(`/admin/artists/${artist.id}`, { method: 'DELETE' })
    if (editingArtistId.value === artist.id) cancelArtistEdit()
    await loadReferenceData()
    showNotice('歌手已删除')
  })
}

function onCategoryTypeChange() {
  const prefix = typePrefix(categoryForm.type)
  if (!prefix) return
  const slug = categoryForm.slug.trim()
  if (!slug) return
  if (slug.startsWith(`${prefix}-`)) return
  const base = slug.replace(/^(genre|mood|era|region|chart|feature)-/, '')
  categoryForm.slug = `${prefix}-${base}`
}

function resetCategoryForm() {
  Object.assign(categoryForm, { name: '', slug: '', type: '', description: '' })
}

async function submitCategory() {
  const isEditing = Boolean(editingCategoryId.value)
  await runSave(async () => {
    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug,
      type: categoryForm.type,
      description: categoryForm.description.trim()
    }
    const path = isEditing
      ? `/admin/categories/${editingCategoryId.value}`
      : '/admin/categories'
    await auth.request(path, {
      method: isEditing ? 'PATCH' : 'POST',
      body: JSON.stringify(payload)
    })
    editingCategoryId.value = ''
    resetCategoryForm()
    await loadReferenceData()
    showNotice(isEditing ? '分类已更新' : '分类创建成功')
  })
}

function startCategoryEdit(category) {
  editingCategoryId.value = category.id
  Object.assign(categoryForm, {
    name: category.name,
    slug: category.slug,
    type: categoryGroup(category),
    description: category.description || ''
  })
}

function cancelCategoryEdit() {
  editingCategoryId.value = ''
  resetCategoryForm()
}

async function deleteCategory(category) {
  const label = categoryGroupLabel(categoryGroup(category))
  if (
    !window.confirm(
      `确定删除${label ? `「${label}」分类` : '分类'}「${category.name}」吗？引用该标签的歌曲将失去此标签。`
    )
  ) {
    return
  }
  await runSave(async () => {
    await auth.request(`/admin/categories/${category.id}`, { method: 'DELETE' })
    if (editingCategoryId.value === category.id) cancelCategoryEdit()
    await loadReferenceData()
    showNotice('分类已删除')
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

async function deleteAlbum(album) {
  if (!window.confirm(`确定删除专辑「${album.title}」吗？`)) return
  await runSave(async () => {
    await auth.request(`/admin/albums/${album.id}`, { method: 'DELETE' })
    await loadReferenceData()
    showNotice('专辑已删除')
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
        <p>维护歌手、分类与专辑，上传本地音频或录入可信远程音频。</p>
      </div>
      <div class="hero-stat">
        <strong>{{ songs.length }}</strong
        ><span>当前页歌曲</span>
      </div>
    </section>

    <p v-if="notice" class="form-message success-message">{{ notice }}</p>
    <p v-if="error" class="form-message error-message">{{ error }}</p>

    <section class="glass-panel metadata-panel">
      <div class="metadata-tabs" role="tablist" aria-label="曲库元数据管理">
        <button
          type="button"
          role="tab"
          :aria-selected="metadataTab === 'artists'"
          :class="{ active: metadataTab === 'artists' }"
          @click="metadataTab = 'artists'"
        >
          歌手
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="metadataTab === 'categories'"
          :class="{ active: metadataTab === 'categories' }"
          @click="metadataTab = 'categories'"
        >
          分类
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="metadataTab === 'albums'"
          :class="{ active: metadataTab === 'albums' }"
          @click="metadataTab = 'albums'"
        >
          专辑
        </button>
      </div>

      <div v-show="metadataTab === 'artists'" class="metadata-pane" role="tabpanel">
        <form class="compact-form" @submit.prevent="submitArtist">
          <h3>{{ editingArtistId ? '编辑歌手' : '新建歌手' }}</h3>
          <input v-model.trim="artistForm.name" placeholder="歌手名称" required />
          <select v-model="artistForm.region">
            <option value="">地区（可选）</option>
            <option
              v-if="editingArtistId && artistForm.region && !regionOptions.includes(artistForm.region)"
              :value="artistForm.region"
            >
              {{ artistForm.region }}
            </option>
            <option v-for="region in regionOptions" :key="region" :value="region">
              {{ region }}
            </option>
          </select>
          <textarea v-model.trim="artistForm.biography" placeholder="简介（可选）"></textarea>
          <div class="artist-avatar-field">
            <img
              v-if="artistAvatarPreview"
              class="artist-avatar-preview"
              :src="artistAvatarPreview"
              alt="歌手头像预览"
            />
            <label
              >歌手头像（可选）<input
                id="artist-avatar-file"
                type="file"
                accept="image/*"
                @change="setArtistAvatar"
            /></label>
          </div>
          <div class="form-actions">
            <button class="secondary-button" :disabled="saving">
              {{ editingArtistId ? '保存修改' : '保存歌手' }}
            </button>
            <button
              v-if="editingArtistId"
              type="button"
              class="text-button"
              @click="cancelArtistEdit"
            >
              取消
            </button>
          </div>
        </form>

        <div class="metadata-list" aria-label="歌手列表">
          <article v-for="artist in artists" :key="artist.id" class="metadata-item">
            <img
              v-if="assetUrl(artist.avatarUrl)"
              class="metadata-thumb round"
              :src="assetUrl(artist.avatarUrl)"
              :alt="artist.name"
            />
            <span v-else class="metadata-thumb round placeholder">{{ artist.name.slice(0, 1) }}</span>
            <div class="metadata-item-main">
              <strong>{{ artist.name }}</strong>
              <small>{{ artist.region || '未设置地区' }} · {{ artist.songCount }} 首</small>
              <p v-if="artist.biography">{{ artist.biography }}</p>
            </div>
            <div class="item-actions">
              <button type="button" @click="startArtistEdit(artist)">编辑</button>
              <button type="button" class="danger-text" @click="deleteArtist(artist)">删除</button>
            </div>
          </article>
          <p v-if="!artists.length" class="empty-state">暂无歌手，先在上方创建一位歌手。</p>
        </div>
      </div>

      <div v-show="metadataTab === 'categories'" class="metadata-pane" role="tabpanel">
        <form class="compact-form" @submit.prevent="submitCategory">
          <h3>{{ editingCategoryId ? '编辑分类' : '新建分类' }}</h3>
          <input v-model.trim="categoryForm.name" placeholder="分类名称" required />
          <select v-model="categoryForm.type" required @change="onCategoryTypeChange">
            <option value="">选择分组</option>
            <option value="GENRE">类型</option>
            <option value="MOOD">心情</option>
            <option value="ERA">年代</option>
            <option value="REGION">地区</option>
            <option value="CHART">榜单</option>
            <option value="FEATURE">特色</option>
          </select>
          <input v-model.trim="categoryForm.slug" placeholder="英文别名，如 genre-rock" required />
          <input v-model.trim="categoryForm.description" placeholder="描述（可选）" />
          <div class="form-actions">
            <button class="secondary-button" :disabled="saving">
              {{ editingCategoryId ? '保存修改' : '保存分类' }}
            </button>
            <button
              v-if="editingCategoryId"
              type="button"
              class="text-button"
              @click="cancelCategoryEdit"
            >
              取消
            </button>
          </div>
        </form>

        <div class="metadata-list" aria-label="分类列表">
          <article v-for="category in categories" :key="category.id" class="metadata-item">
            <div class="metadata-item-main">
              <strong>{{ category.name }}</strong>
              <small>
                <span class="tag">{{ categoryGroupLabel(categoryGroup(category)) }}</span>
                {{ category.slug }}
              </small>
              <p v-if="category.description">{{ category.description }}</p>
            </div>
            <div class="item-actions">
              <button type="button" @click="startCategoryEdit(category)">编辑</button>
              <button type="button" class="danger-text" @click="deleteCategory(category)">删除</button>
            </div>
          </article>
          <p v-if="!categories.length" class="empty-state">暂无分类，先在上方创建一条分类。</p>
        </div>
      </div>

      <div v-show="metadataTab === 'albums'" class="metadata-pane" role="tabpanel">
        <form class="compact-form" @submit.prevent="createAlbum">
          <h3>新建专辑</h3>
          <input v-model.trim="albumForm.title" placeholder="专辑名称" required />
          <select v-model="albumForm.artistId" required>
            <option value="">选择歌手</option>
            <option v-for="artist in artists" :key="artist.id" :value="artist.id">
              {{ artist.name }}
            </option>
          </select>
          <input v-model="albumForm.releaseDate" type="date" />
          <input v-model.trim="albumForm.description" placeholder="描述（可选）" />
          <button class="secondary-button" :disabled="saving">保存专辑</button>
        </form>

        <div class="metadata-list" aria-label="专辑列表">
          <article v-for="album in albums" :key="album.id" class="metadata-item">
            <img
              v-if="assetUrl(album.coverUrl)"
              class="metadata-thumb"
              :src="assetUrl(album.coverUrl)"
              :alt="album.title"
            />
            <span v-else class="metadata-thumb placeholder">专辑</span>
            <div class="metadata-item-main">
              <strong>{{ album.title }}</strong>
              <small>
                {{ album.artist.name }} · {{ album.songCount }} 首
                <template v-if="album.releaseDate"> · {{ formatDate(album.releaseDate) }}</template>
              </small>
              <p v-if="album.description">{{ album.description }}</p>
            </div>
            <div class="item-actions">
              <button type="button" class="danger-text" @click="deleteAlbum(album)">删除</button>
            </div>
          </article>
          <p v-if="!albums.length" class="empty-state">暂无专辑，先在上方创建一张专辑。</p>
        </div>
      </div>
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
        <CategoryTagPicker v-model="uploadForm.categoryIds" :categories="categories" />
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
        <CategoryTagPicker v-model="remoteForm.categoryIds" :categories="categories" />
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

<style scoped>
.metadata-panel {
  padding: 18px 20px 22px;
}

.metadata-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(25, 25, 25, 0.08);
}

.metadata-tabs button {
  padding: 8px 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary, #6b7280);
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.metadata-tabs button:hover {
  color: var(--brand-strong, #e94e77);
}

.metadata-tabs button.active {
  background: var(--brand, #ff699d);
  color: #fff;
  border-color: var(--brand, #ff699d);
}

.metadata-pane {
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  gap: 18px;
  padding-top: 18px;
}

.metadata-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 520px;
  overflow: auto;
  padding-right: 4px;
}

.metadata-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.45);
}

.metadata-thumb {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: 10px;
  object-fit: cover;
  background: rgba(255, 192, 203, 0.35);
}

.metadata-thumb.round {
  border-radius: 50%;
}

.metadata-thumb.placeholder {
  color: var(--brand-strong, #e94e77);
  font-size: 18px;
  font-weight: 900;
}

.metadata-item-main {
  flex: 1 1 auto;
  min-width: 0;
}

.metadata-item-main strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metadata-item-main small {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
}

.metadata-item-main p {
  margin: 6px 0 0;
  color: var(--text-secondary, #6b7280);
  font-size: 12px;
  line-height: 1.5;
}

.item-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 6px;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-button {
  padding: 7px 14px;
  border: 1px solid rgba(25, 25, 25, 0.18);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary, #6b7280);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.artist-avatar-field {
  display: flex;
  align-items: center;
  gap: 14px;
}

.artist-avatar-field label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  font-weight: 700;
}

.artist-avatar-field input[type='file'] {
  max-width: 170px;
  font-size: 12px;
}

.artist-avatar-preview {
  width: 52px;
  height: 52px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 6px 16px rgba(93, 54, 70, 0.16);
}

@media (max-width: 900px) {
  .metadata-pane {
    grid-template-columns: 1fr;
  }
}
</style>
