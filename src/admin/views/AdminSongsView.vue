<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { API_BASE_URL } from '../api'
import { useAdminAuthStore } from '../auth'
import { useAdminStatsStore } from '../stats'
import CategoryTagPicker from '../components/CategoryTagPicker.vue'

const auth = useAdminAuthStore()
const statsStore = useAdminStatsStore()
const songs = ref([])
const artists = ref([])
const albums = ref([])
const playlists = ref([])
const categories = ref([])
const selectedIds = ref([])
const loading = ref(false)
const saving = ref(false)
const toast = ref(null)
let toastTimer = null
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const totalPages = ref(1)
const workspaceTab = ref('metadata')
const metadataTab = ref('artists')
const editingArtistId = ref('')
const editingCategoryId = ref('')
const editingAlbumId = ref('')
const editingPlaylistId = ref('')
const activeCategoryGroup = ref('GENRE')
const editingCategoryGroup = ref('')
const METADATA_PAGE_SIZE = 5
const artistPage = ref(1)
const categoryPage = ref(1)
const albumPage = ref(1)
const playlistPage = ref(1)
const artistSearch = ref('')
const albumSearch = ref('')
const playlistSearch = ref('')
const playlistSongSearch = ref('')
const playlistSongLibrary = ref([])
const playlistSongLoading = ref(false)
const playlistSelectedSongs = reactive({})
const playlistCoverPreview = ref('')

const artistForm = reactive({ name: '', region: '', biography: '', avatar: null })
const categoryForm = reactive({ name: '', slug: '' })
const albumForm = reactive({
  title: '',
  artistId: '',
  releaseDate: '',
  description: '',
  cover: null
})
const playlistForm = reactive({
  title: '',
  description: '',
  categoryIds: [],
  songIds: [],
  isPublished: false,
  cover: null
})
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
const albumCoverPreview = ref('')
const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin
const allSelected = computed(
  () => songs.value.length > 0 && selectedIds.value.length === songs.value.length
)

const summaryItems = computed(() => {
  const stats = statsStore.stats
  if (!stats) return []
  return [
    { label: '歌曲', value: stats.songs.total },
    { label: '已上架', value: stats.songs.published },
    { label: '歌手', value: stats.artists },
    { label: '专辑', value: stats.albums },
    { label: '分类', value: stats.categories },
    { label: '总播放', value: stats.totalPlays }
  ]
})

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${units[unit]}`
}

const storageInfo = computed(() => {
  const storage = statsStore.stats?.storage
  if (!storage || !storage.totalBytes) return null
  const percent = Math.min(
    100,
    Math.round((storage.usedBytes / storage.totalBytes) * 100)
  )
  return {
    percent,
    usedLabel: formatBytes(storage.usedBytes),
    totalLabel: formatBytes(storage.totalBytes)
  }
})

const CATEGORY_TYPE_LABELS = {
  GENRE: '类型',
  MOOD: '心情',
  ERA: '年代',
  REGION: '地区',
  CHART: '榜单',
  FEATURE: '特色'
}
const CATEGORY_GROUPS = [
  { key: 'GENRE', label: '类型' },
  { key: 'MOOD', label: '心情' },
  { key: 'ERA', label: '年代' },
  { key: 'REGION', label: '地区' },
  { key: 'CHART', label: '榜单' },
  { key: 'FEATURE', label: '特色' }
]
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

const categoryGroups = computed(() =>
  CATEGORY_GROUPS.map((group) => ({
    ...group,
    items: categories.value.filter((category) => categoryGroup(category) === group.key)
  }))
)

const activeGroupCategories = computed(() =>
  categories.value.filter((category) => categoryGroup(category) === activeCategoryGroup.value)
)

const filteredArtists = computed(() => {
  const keyword = artistSearch.value.trim().toLowerCase()
  if (!keyword) return artists.value
  return artists.value.filter((artist) =>
    [artist.name, artist.region].some((value) =>
      String(value || '').toLowerCase().includes(keyword)
    )
  )
})

const filteredAlbums = computed(() => {
  const keyword = albumSearch.value.trim().toLowerCase()
  if (!keyword) return albums.value
  return albums.value.filter((album) =>
    [album.title, album.artist?.name].some((value) =>
      String(value || '').toLowerCase().includes(keyword)
    )
  )
})

const filteredPlaylists = computed(() => {
  const keyword = playlistSearch.value.trim().toLowerCase()
  if (!keyword) return playlists.value
  return playlists.value.filter((playlist) =>
    [playlist.title, playlist.genre, playlist.mood].some((value) =>
      String(value || '').toLowerCase().includes(keyword)
    )
  )
})

const artistTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredArtists.value.length / METADATA_PAGE_SIZE))
)

const albumTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredAlbums.value.length / METADATA_PAGE_SIZE))
)

const playlistTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredPlaylists.value.length / METADATA_PAGE_SIZE))
)

const categoryTotalPages = computed(() =>
  Math.max(1, Math.ceil(activeGroupCategories.value.length / METADATA_PAGE_SIZE))
)

const pagedArtists = computed(() => {
  const start = (artistPage.value - 1) * METADATA_PAGE_SIZE
  return filteredArtists.value.slice(start, start + METADATA_PAGE_SIZE)
})

const pagedAlbums = computed(() => {
  const start = (albumPage.value - 1) * METADATA_PAGE_SIZE
  return filteredAlbums.value.slice(start, start + METADATA_PAGE_SIZE)
})

const pagedPlaylists = computed(() => {
  const start = (playlistPage.value - 1) * METADATA_PAGE_SIZE
  return filteredPlaylists.value.slice(start, start + METADATA_PAGE_SIZE)
})

const selectedPlaylistSongs = computed(() =>
  playlistForm.songIds.map((id) => playlistSelectedSongs[id]).filter(Boolean)
)

const pagedGroupCategories = computed(() => {
  const start = (categoryPage.value - 1) * METADATA_PAGE_SIZE
  return activeGroupCategories.value.slice(start, start + METADATA_PAGE_SIZE)
})

const activeCategoryGroupLabel = computed(
  () => CATEGORY_TYPE_LABELS[activeCategoryGroup.value] || '未分组'
)

const editingCategoryGroupLabel = computed(
  () => CATEGORY_TYPE_LABELS[editingCategoryGroup.value] || '未分组'
)

const categorySlugPrefix = computed(() => {
  const group = editingCategoryGroup.value || activeCategoryGroup.value
  const prefix = typePrefix(group)
  return prefix ? `${prefix}-` : ''
})

const categorySlugPreview = computed(() => {
  const group = editingCategoryGroup.value || activeCategoryGroup.value
  const prefix = typePrefix(group)
  const suffix = categoryForm.slug.trim()
  if (!prefix) return suffix
  return suffix ? `${prefix}-${suffix}` : ''
})

const categoryDescriptionPreview = computed(() => {
  const group = editingCategoryGroup.value || activeCategoryGroup.value
  return defaultCategoryDescription(group)
})

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
  pushToast(message, 'success')
}

function showError(requestError) {
  pushToast(requestError.message || '操作失败', 'error')
}

function pushToast(message, type) {
  toast.value = { message, type }
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(
    () => {
      toast.value = null
    },
    type === 'error' ? 4500 : 2600
  )
}

async function loadReferenceData() {
  const [artistData, albumData, categoryData, playlistData] = await Promise.all([
    auth.request('/artists'),
    auth.request('/albums'),
    auth.request('/categories'),
    auth.request('/admin/playlists')
  ])
  artists.value = artistData
  albums.value = albumData
  categories.value = categoryData
  playlists.value = playlistData
}

async function loadSongs() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: '10' })
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
  try {
    await action()
    void statsStore.refresh()
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

function clearArtistForm() {
  editingArtistId.value = ''
  resetArtistForm()
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

function selectCategoryGroup(group) {
  editingCategoryId.value = ''
  editingCategoryGroup.value = ''
  activeCategoryGroup.value = group
  categoryPage.value = 1
  resetCategoryForm()
}

function defaultCategoryDescription(group) {
  const prefix = typePrefix(group)
  return prefix ? `${prefix} 分类` : ''
}

function stripGroupPrefix(slug) {
  return String(slug || '')
    .trim()
    .replace(/^(genre|mood|era|region|chart|feature)-/, '')
}

function resetCategoryForm() {
  Object.assign(categoryForm, { name: '', slug: '' })
}

function clearCategoryForm() {
  editingCategoryId.value = ''
  editingCategoryGroup.value = ''
  resetCategoryForm()
}

async function submitCategory() {
  const isEditing = Boolean(editingCategoryId.value)
  const group = editingCategoryGroup.value || activeCategoryGroup.value
  await runSave(async () => {
    const payload = {
      name: categoryForm.name,
      slug: categorySlugPreview.value,
      type: group,
      description: defaultCategoryDescription(group)
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
  editingCategoryGroup.value = categoryGroup(category)
  Object.assign(categoryForm, {
    name: category.name,
    slug: stripGroupPrefix(category.slug)
  })
}

function cancelCategoryEdit() {
  editingCategoryId.value = ''
  editingCategoryGroup.value = ''
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

function clearAlbumCoverPreview() {
  if (albumCoverPreview.value) URL.revokeObjectURL(albumCoverPreview.value)
  albumCoverPreview.value = ''
}

function resetAlbumForm() {
  Object.assign(albumForm, {
    title: '',
    artistId: '',
    releaseDate: '',
    description: '',
    cover: null
  })
  clearAlbumCoverPreview()
  const coverInput = document.querySelector('#album-cover-file')
  if (coverInput) coverInput.value = ''
}

function clearAlbumForm() {
  editingAlbumId.value = ''
  resetAlbumForm()
}

function setAlbumCover(event) {
  const file = event.target.files?.[0] || null
  albumForm.cover = file
  if (albumCoverPreview.value) URL.revokeObjectURL(albumCoverPreview.value)
  albumCoverPreview.value = file ? URL.createObjectURL(file) : ''
}

async function submitAlbum() {
  const isEditing = Boolean(editingAlbumId.value)
  await runSave(async () => {
    const formData = new FormData()
    formData.set('title', albumForm.title)
    formData.set('artistId', albumForm.artistId)
    if (albumForm.releaseDate || isEditing) {
      formData.set('releaseDate', albumForm.releaseDate)
    }
    if (albumForm.description.trim() || isEditing) {
      formData.set('description', albumForm.description.trim())
    }
    if (albumForm.cover) formData.set('cover', albumForm.cover)

    const path = isEditing ? `/admin/albums/${editingAlbumId.value}` : '/admin/albums'
    await auth.request(path, {
      method: isEditing ? 'PATCH' : 'POST',
      body: formData
    })
    editingAlbumId.value = ''
    resetAlbumForm()
    await loadReferenceData()
    showNotice(isEditing ? '专辑已更新' : '专辑创建成功')
  })
}

function startAlbumEdit(album) {
  editingAlbumId.value = album.id
  Object.assign(albumForm, {
    title: album.title,
    artistId: album.artist.id,
    releaseDate: formatDate(album.releaseDate),
    description: album.description || '',
    cover: null
  })
  clearAlbumCoverPreview()
  const coverInput = document.querySelector('#album-cover-file')
  if (coverInput) coverInput.value = ''
}

function cancelAlbumEdit() {
  editingAlbumId.value = ''
  resetAlbumForm()
}

async function deleteAlbum(album) {
  if (!window.confirm(`确定删除专辑「${album.title}」吗？`)) return
  await runSave(async () => {
    await auth.request(`/admin/albums/${album.id}`, { method: 'DELETE' })
    if (editingAlbumId.value === album.id) cancelAlbumEdit()
    await loadReferenceData()
    showNotice('专辑已删除')
  })
}

function clearPlaylistCoverPreview() {
  if (playlistCoverPreview.value) URL.revokeObjectURL(playlistCoverPreview.value)
  playlistCoverPreview.value = ''
}

function resetPlaylistForm() {
  Object.assign(playlistForm, {
    title: '',
    description: '',
    categoryIds: [],
    songIds: [],
    isPublished: false,
    cover: null
  })
  for (const key of Object.keys(playlistSelectedSongs)) {
    delete playlistSelectedSongs[key]
  }
  clearPlaylistCoverPreview()
  const coverInput = document.querySelector('#playlist-cover-file')
  if (coverInput) coverInput.value = ''
}

function clearPlaylistForm() {
  editingPlaylistId.value = ''
  resetPlaylistForm()
}

function setPlaylistCover(event) {
  const file = event.target.files?.[0] || null
  playlistForm.cover = file
  if (playlistCoverPreview.value) URL.revokeObjectURL(playlistCoverPreview.value)
  playlistCoverPreview.value = file ? URL.createObjectURL(file) : ''
}

async function submitPlaylist() {
  const isEditing = Boolean(editingPlaylistId.value)
  await runSave(async () => {
    const formData = new FormData()
    formData.set('title', playlistForm.title)
    if (playlistForm.description.trim() || isEditing) {
      formData.set('description', playlistForm.description.trim())
    }
    formData.set('categoryIds', JSON.stringify(playlistForm.categoryIds))
    formData.set('songIds', JSON.stringify(playlistForm.songIds))
    formData.set('isPublished', String(playlistForm.isPublished))
    if (playlistForm.cover) formData.set('cover', playlistForm.cover)

    const path = isEditing
      ? `/admin/playlists/${editingPlaylistId.value}`
      : '/admin/playlists'
    await auth.request(path, {
      method: isEditing ? 'PATCH' : 'POST',
      body: formData
    })
    editingPlaylistId.value = ''
    resetPlaylistForm()
    await loadReferenceData()
    showNotice(isEditing ? '歌单已更新' : '歌单创建成功')
  })
}

function startPlaylistEdit(playlist) {
  editingPlaylistId.value = playlist.id
  Object.assign(playlistForm, {
    title: playlist.title,
    description: playlist.description || '',
    categoryIds: (playlist.categories || []).map((category) => category.id),
    songIds: (playlist.songs || []).map((song) => song.id),
    isPublished: Boolean(playlist.isPublished),
    cover: null
  })
  for (const key of Object.keys(playlistSelectedSongs)) {
    delete playlistSelectedSongs[key]
  }
  for (const song of playlist.songs || []) {
    playlistSelectedSongs[song.id] = song
  }
  clearPlaylistCoverPreview()
  const coverInput = document.querySelector('#playlist-cover-file')
  if (coverInput) coverInput.value = ''
}

function cancelPlaylistEdit() {
  editingPlaylistId.value = ''
  resetPlaylistForm()
}

async function deletePlaylist(playlist) {
  if (!window.confirm(`确定删除歌单「${playlist.title}」吗？`)) return
  await runSave(async () => {
    await auth.request(`/admin/playlists/${playlist.id}`, { method: 'DELETE' })
    if (editingPlaylistId.value === playlist.id) cancelPlaylistEdit()
    await loadReferenceData()
    showNotice('歌单已删除')
  })
}

function previousPlaylistPage() {
  if (playlistPage.value <= 1) return
  playlistPage.value -= 1
}

function nextPlaylistPage() {
  if (playlistPage.value >= playlistTotalPages.value) return
  playlistPage.value += 1
}

function isPlaylistSongSelected(song) {
  return playlistForm.songIds.includes(song.id)
}

function togglePlaylistSong(song) {
  const index = playlistForm.songIds.indexOf(song.id)
  if (index >= 0) {
    playlistForm.songIds.splice(index, 1)
    delete playlistSelectedSongs[song.id]
  } else {
    playlistForm.songIds.push(song.id)
    playlistSelectedSongs[song.id] = song
  }
}

function removePlaylistSong(songId) {
  const index = playlistForm.songIds.indexOf(songId)
  if (index >= 0) playlistForm.songIds.splice(index, 1)
  delete playlistSelectedSongs[songId]
}

async function searchPlaylistSongs() {
  playlistSongLoading.value = true
  try {
    const params = new URLSearchParams({ page: '1', pageSize: '50' })
    if (playlistSongSearch.value.trim()) {
      params.set('search', playlistSongSearch.value.trim())
    }
    const result = await auth.request(`/admin/songs?${params}`)
    playlistSongLibrary.value = result.items
  } catch (requestError) {
    showError(requestError)
  } finally {
    playlistSongLoading.value = false
  }
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

function previousArtistPage() {
  if (artistPage.value <= 1) return
  artistPage.value -= 1
}

function nextArtistPage() {
  if (artistPage.value >= artistTotalPages.value) return
  artistPage.value += 1
}

function previousCategoryPage() {
  if (categoryPage.value <= 1) return
  categoryPage.value -= 1
}

function nextCategoryPage() {
  if (categoryPage.value >= categoryTotalPages.value) return
  categoryPage.value += 1
}

function previousAlbumPage() {
  if (albumPage.value <= 1) return
  albumPage.value -= 1
}

function nextAlbumPage() {
  if (albumPage.value >= albumTotalPages.value) return
  albumPage.value += 1
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

watch([artistSearch, albumSearch, playlistSearch], () => {
  artistPage.value = 1
  albumPage.value = 1
  playlistPage.value = 1
})

watch([filteredArtists, filteredAlbums, activeGroupCategories, filteredPlaylists], () => {
  if (artistPage.value > artistTotalPages.value) artistPage.value = artistTotalPages.value
  if (albumPage.value > albumTotalPages.value) albumPage.value = albumTotalPages.value
  if (categoryPage.value > categoryTotalPages.value) categoryPage.value = categoryTotalPages.value
  if (playlistPage.value > playlistTotalPages.value) playlistPage.value = playlistTotalPages.value
})

onMounted(async () => {
  resetCategoryForm()
  void statsStore.refresh()
  try {
    await Promise.all([loadReferenceData(), loadSongs()])
    void searchPlaylistSongs()
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

    <section v-if="summaryItems.length" class="glass-panel summary-strip" aria-label="数据汇总">
      <div v-for="item in summaryItems" :key="item.label" class="summary-card">
        <strong>{{ item.value }}</strong>
        <span>{{ item.label }}</span>
      </div>
    </section>

    <section v-if="storageInfo" class="glass-panel storage-panel" aria-label="存储空间">
      <div class="storage-top">
        <span class="storage-title">存储空间</span>
        <span class="storage-percent">{{ storageInfo.percent }}%</span>
      </div>
      <div
        class="storage-bar"
        role="progressbar"
        :aria-valuenow="storageInfo.percent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="storage-bar-fill"
          :style="{ width: `${storageInfo.percent}%` }"
        ></div>
      </div>
      <div class="storage-bottom">
        <span>已用 {{ storageInfo.usedLabel }}</span>
        <span>总共 {{ storageInfo.totalLabel }}</span>
      </div>
    </section>

    <div class="workspace-tabs" role="tablist" aria-label="后台功能分区">
      <button
        type="button"
        role="tab"
        :aria-selected="workspaceTab === 'metadata'"
        :class="{ active: workspaceTab === 'metadata' }"
        @click="workspaceTab = 'metadata'"
      >
        歌手 / 分类 / 专辑
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="workspaceTab === 'editor'"
        :class="{ active: workspaceTab === 'editor' }"
        @click="workspaceTab = 'editor'"
      >
        上传本地歌曲 / 录入远程歌曲
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="workspaceTab === 'library'"
        :class="{ active: workspaceTab === 'library' }"
        @click="workspaceTab = 'library'"
      >
        歌曲列表
      </button>
    </div>

    <Transition name="toast">
      <div
        v-if="toast"
        class="toast"
        :class="`is-${toast.type}`"
        role="status"
        aria-live="polite"
      >
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <section v-show="workspaceTab === 'metadata'" class="glass-panel metadata-panel">
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
        <button
          type="button"
          role="tab"
          :aria-selected="metadataTab === 'playlists'"
          :class="{ active: metadataTab === 'playlists' }"
          @click="metadataTab = 'playlists'"
        >
          歌单
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
            <button type="button" class="text-button" @click="clearArtistForm">
              清除
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

        <div class="metadata-list-column">
          <input
            v-model.trim="artistSearch"
            class="metadata-search"
            type="search"
            placeholder="搜索歌手名称或地区"
          />
          <div class="metadata-list" aria-label="歌手列表">
            <article v-for="artist in pagedArtists" :key="artist.id" class="metadata-item">
              <img
                v-if="assetUrl(artist.avatarUrl)"
                class="metadata-thumb round"
                :src="assetUrl(artist.avatarUrl)"
                :alt="artist.name"
              />
              <span v-else class="metadata-thumb round placeholder">{{
                artist.name.slice(0, 1)
              }}</span>
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
            <p v-if="!filteredArtists.length" class="empty-state">
              {{ artistSearch.trim() ? '未找到匹配的歌手' : '暂无歌手，先在上方创建一位歌手。' }}
            </p>
          </div>
          <div v-if="artistTotalPages > 1" class="metadata-pager">
            <button
              type="button"
              :disabled="artistPage <= 1"
              @click="previousArtistPage"
            >
              上一页
            </button>
            <span>{{ artistPage }} / {{ artistTotalPages }}</span>
            <button
              type="button"
              :disabled="artistPage >= artistTotalPages"
              @click="nextArtistPage"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <div v-show="metadataTab === 'categories'" class="metadata-pane category-pane" role="tabpanel">
        <div class="category-groups" role="tablist" aria-label="分类分组">
          <button
            v-for="group in categoryGroups"
            :key="group.key"
            type="button"
            role="tab"
            :aria-selected="activeCategoryGroup === group.key"
            :class="{ active: activeCategoryGroup === group.key }"
            @click="selectCategoryGroup(group.key)"
          >
            {{ group.label }}
            <span class="group-count">{{ group.items.length }}</span>
          </button>
        </div>

        <div class="category-pane-body">
          <form class="compact-form" @submit.prevent="submitCategory">
            <h3>
              {{
                editingCategoryId
                  ? `编辑标签（${editingCategoryGroupLabel}）`
                  : `在「${activeCategoryGroupLabel}」下新建标签`
              }}
            </h3>
            <div class="form-row">
              <input v-model.trim="categoryForm.name" placeholder="标签名称，如 摇滚" required />
              <div class="slug-input">
                <span class="slug-input-prefix">{{ categorySlugPrefix }}</span>
                <input v-model.trim="categoryForm.slug" placeholder="别名后缀，如 rock" required />
              </div>
            </div>
            <p v-if="categorySlugPreview" class="slug-preview">
              将保存为 <code>{{ categorySlugPreview }}</code>
            </p>
            <p class="description-preview">
              描述：<span>{{ categoryDescriptionPreview }}</span>
            </p>
            <div class="form-actions">
              <button class="secondary-button" :disabled="saving">
                {{ editingCategoryId ? '保存修改' : '保存标签' }}
              </button>
              <button type="button" class="text-button" @click="clearCategoryForm">
                清除
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

          <div class="metadata-list-column">
            <div class="tag-card-list" aria-label="分类标签列表">
              <article v-for="category in pagedGroupCategories" :key="category.id" class="tag-card">
                <div class="tag-card-main">
                  <strong>{{ category.name }}</strong>
                  <small>{{ category.slug }}</small>
                  <p v-if="category.description">{{ category.description }}</p>
                </div>
                <div class="item-actions">
                  <button type="button" @click="startCategoryEdit(category)">编辑</button>
                  <button type="button" class="danger-text" @click="deleteCategory(category)">删除</button>
                </div>
              </article>
              <p v-if="!activeGroupCategories.length" class="empty-state">
                该分组下暂无标签，使用上方表单新建一个。
              </p>
            </div>
            <div v-if="categoryTotalPages > 1" class="metadata-pager">
              <button
                type="button"
                :disabled="categoryPage <= 1"
                @click="previousCategoryPage"
              >
                上一页
              </button>
              <span>{{ categoryPage }} / {{ categoryTotalPages }}</span>
              <button
                type="button"
                :disabled="categoryPage >= categoryTotalPages"
                @click="nextCategoryPage"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-show="metadataTab === 'albums'" class="metadata-pane" role="tabpanel">
        <form class="compact-form" @submit.prevent="submitAlbum">
          <h3>{{ editingAlbumId ? '编辑专辑' : '新建专辑' }}</h3>
          <input v-model.trim="albumForm.title" placeholder="专辑名称" required />
          <select v-model="albumForm.artistId" required>
            <option value="">选择歌手</option>
            <option v-for="artist in artists" :key="artist.id" :value="artist.id">
              {{ artist.name }}
            </option>
          </select>
          <input v-model="albumForm.releaseDate" type="date" />
          <input v-model.trim="albumForm.description" placeholder="描述（可选）" />
          <div class="album-cover-field">
            <img
              v-if="albumCoverPreview"
              class="album-cover-preview"
              :src="albumCoverPreview"
              alt="专辑封面预览"
            />
            <label
              >封面（可选）<input
                id="album-cover-file"
                type="file"
                accept="image/*"
                @change="setAlbumCover"
            /></label>
          </div>
          <div class="form-actions">
            <button class="secondary-button" :disabled="saving">
              {{ editingAlbumId ? '保存修改' : '保存专辑' }}
            </button>
            <button type="button" class="text-button" @click="clearAlbumForm">
              清除
            </button>
            <button
              v-if="editingAlbumId"
              type="button"
              class="text-button"
              @click="cancelAlbumEdit"
            >
              取消
            </button>
          </div>
        </form>

        <div class="metadata-list-column">
          <input
            v-model.trim="albumSearch"
            class="metadata-search"
            type="search"
            placeholder="搜索专辑名称或歌手"
          />
          <div class="metadata-list" aria-label="专辑列表">
            <article v-for="album in pagedAlbums" :key="album.id" class="metadata-item">
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
                  <template v-if="album.releaseDate">
                    · {{ formatDate(album.releaseDate) }}
                  </template>
                </small>
                <p v-if="album.description">{{ album.description }}</p>
              </div>
              <div class="item-actions">
                <button type="button" @click="startAlbumEdit(album)">编辑</button>
                <button type="button" class="danger-text" @click="deleteAlbum(album)">删除</button>
              </div>
            </article>
            <p v-if="!filteredAlbums.length" class="empty-state">
              {{ albumSearch.trim() ? '未找到匹配的专辑' : '暂无专辑，先在上方创建一张专辑。' }}
            </p>
          </div>
          <div v-if="albumTotalPages > 1" class="metadata-pager">
            <button
              type="button"
              :disabled="albumPage <= 1"
              @click="previousAlbumPage"
            >
              上一页
            </button>
            <span>{{ albumPage }} / {{ albumTotalPages }}</span>
            <button
              type="button"
              :disabled="albumPage >= albumTotalPages"
              @click="nextAlbumPage"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <div v-show="metadataTab === 'playlists'" class="metadata-pane playlist-pane" role="tabpanel">
        <form class="compact-form playlist-form" @submit.prevent="submitPlaylist">
          <h3>{{ editingPlaylistId ? '编辑歌单' : '新建歌单' }}</h3>
          <input v-model.trim="playlistForm.title" placeholder="歌单名称" required />
          <input v-model.trim="playlistForm.description" placeholder="描述（可选）" />
          <div class="album-cover-field">
            <img
              v-if="playlistCoverPreview"
              class="album-cover-preview"
              :src="playlistCoverPreview"
              alt="歌单封面预览"
            />
            <label
              >封面（可选）<input
                id="playlist-cover-file"
                type="file"
                accept="image/*"
                @change="setPlaylistCover"
            /></label>
          </div>
          <CategoryTagPicker v-model="playlistForm.categoryIds" :categories="categories" />
          <label class="publish-check"
            ><input v-model="playlistForm.isPublished" type="checkbox" /> 立即发布到前台</label
          >

          <div class="playlist-selected">
            <div class="playlist-selected-head">
              <span>已选歌曲 · {{ selectedPlaylistSongs.length }} 首</span>
            </div>
            <div v-if="selectedPlaylistSongs.length" class="playlist-selected-list">
              <div
                v-for="(song, index) in selectedPlaylistSongs"
                :key="song.id"
                class="playlist-selected-item"
              >
                <span class="playlist-selected-index">{{ index + 1 }}</span>
                <span class="playlist-selected-title">{{ song.title }}</span>
                <small>{{ song.artist?.name }}</small>
                <button type="button" @click="removePlaylistSong(song.id)">移除</button>
              </div>
            </div>
            <p v-else class="playlist-selected-empty">暂无歌曲，从右侧歌曲库勾选添加。</p>
          </div>

          <div class="form-actions">
            <button class="secondary-button" :disabled="saving">
              {{ editingPlaylistId ? '保存修改' : '保存歌单' }}
            </button>
            <button type="button" class="text-button" @click="clearPlaylistForm">清除</button>
            <button
              v-if="editingPlaylistId"
              type="button"
              class="text-button"
              @click="cancelPlaylistEdit"
            >
              取消
            </button>
          </div>
        </form>

        <div class="metadata-list-column">
          <input
            v-model.trim="playlistSearch"
            class="metadata-search"
            type="search"
            placeholder="搜索歌单名称或风格"
          />
          <div class="metadata-list" aria-label="歌单列表">
            <article
              v-for="playlist in pagedPlaylists"
              :key="playlist.id"
              class="metadata-item"
            >
              <img
                v-if="assetUrl(playlist.coverUrl)"
                class="metadata-thumb"
                :src="assetUrl(playlist.coverUrl)"
                :alt="playlist.title"
              />
              <span v-else class="metadata-thumb placeholder">歌单</span>
              <div class="metadata-item-main">
                <strong>{{ playlist.title }}</strong>
                <small>
                  {{ playlist.genre || '未分类' }} · {{ playlist.songCount }} 首 ·
                  {{ playlist.isPublished ? '已发布' : '未发布' }}
                </small>
                <p v-if="playlist.description">{{ playlist.description }}</p>
              </div>
              <div class="item-actions">
                <button type="button" @click="startPlaylistEdit(playlist)">编辑</button>
                <button type="button" class="danger-text" @click="deletePlaylist(playlist)">
                  删除
                </button>
              </div>
            </article>
            <p v-if="!filteredPlaylists.length" class="empty-state">
              {{ playlistSearch.trim() ? '未找到匹配的歌单' : '暂无歌单，先在上方创建一张歌单。' }}
            </p>
          </div>
          <div v-if="playlistTotalPages > 1" class="metadata-pager">
            <button
              type="button"
              :disabled="playlistPage <= 1"
              @click="previousPlaylistPage"
            >
              上一页
            </button>
            <span>{{ playlistPage }} / {{ playlistTotalPages }}</span>
            <button
              type="button"
              :disabled="playlistPage >= playlistTotalPages"
              @click="nextPlaylistPage"
            >
              下一页
            </button>
          </div>

          <div class="playlist-song-picker">
            <div class="playlist-song-picker-head">
              <strong>添加歌曲</strong>
              <div class="playlist-song-search">
                <input
                  v-model.trim="playlistSongSearch"
                  placeholder="搜索歌曲"
                  @keyup.enter="searchPlaylistSongs"
                />
                <button type="button" @click="searchPlaylistSongs">搜索</button>
              </div>
            </div>
            <div v-if="playlistSongLoading" class="empty-state">加载中…</div>
            <div v-else class="playlist-song-picker-list">
              <label
                v-for="song in playlistSongLibrary"
                :key="song.id"
                class="playlist-song-pick-item"
                :class="{ active: isPlaylistSongSelected(song) }"
              >
                <input
                  type="checkbox"
                  :checked="isPlaylistSongSelected(song)"
                  @change="togglePlaylistSong(song)"
                />
                <span>{{ song.title }}</span>
                <small>{{ song.artist?.name }}</small>
              </label>
              <p v-if="!playlistSongLibrary.length" class="empty-state">
                暂无歌曲，请先上传歌曲。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-show="workspaceTab === 'editor'" class="song-editor-grid">
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

    <section v-show="workspaceTab === 'library'" class="glass-panel table-panel">
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
.summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 12px;
  margin-bottom: 22px;
  padding: 16px 18px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 12px 10px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.summary-card strong {
  font-size: 25px;
  font-weight: 900;
  color: var(--brand-strong, #e94e77);
}

.summary-card span {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-secondary, #6b7280);
  letter-spacing: 1px;
}

.storage-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 22px;
  padding: 16px 18px;
}

.storage-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.storage-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-secondary, #6b7280);
  letter-spacing: 1px;
}

.storage-percent {
  font-size: 20px;
  font-weight: 900;
  color: var(--brand-strong, #e94e77);
}

.storage-bar {
  height: 12px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.08);
  overflow: hidden;
}

.storage-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--brand, #ff699d),
    var(--brand-strong, #e94e77)
  );
  transition: width 0.3s ease;
}

.storage-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary, #6b7280);
}

.workspace-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.workspace-tabs button {
  padding: 10px 20px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary, #6b7280);
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.workspace-tabs button:hover {
  color: var(--brand-strong, #e94e77);
}

.workspace-tabs button.active {
  background: var(--brand, #ff699d);
  border-color: var(--brand, #ff699d);
  color: #fff;
}

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

.metadata-pane > .compact-form,
.category-pane-body > .compact-form {
  height: 460px;
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

.category-pane {
  display: block;
}

.category-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-groups button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 15px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary, #6b7280);
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.category-groups button:hover {
  color: var(--brand-strong, #e94e77);
}

.category-groups button.active {
  background: var(--brand, #ff699d);
  border-color: var(--brand, #ff699d);
  color: #fff;
}

.group-count {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: var(--text-secondary, #6b7280);
  font-size: 11px;
}

.category-groups button.active .group-count {
  background: rgba(255, 255, 255, 0.24);
  color: #fff;
}

.category-pane-body {
  display: grid;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
  gap: 18px;
  padding-top: 16px;
}

.tag-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 460px;
  overflow: auto;
  padding-right: 4px;
}

.tag-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.45);
}

.tag-card-main {
  min-width: 0;
}

.tag-card-main strong {
  display: block;
}

.tag-card-main small {
  display: block;
  margin-top: 2px;
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
}

.tag-card-main p {
  margin: 6px 0 0;
  color: var(--text-secondary, #6b7280);
  font-size: 12px;
  line-height: 1.5;
}

.slug-preview {
  margin: 0 0 10px;
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
}

.slug-preview code {
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 105, 157, 0.12);
  color: var(--brand-strong, #e94e77);
}

.description-preview {
  margin: 0 0 10px;
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
}

.description-preview span {
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 105, 157, 0.12);
  color: var(--brand-strong, #e94e77);
}

.slug-input {
  display: flex;
  align-items: center;
  border: 1px solid rgba(112, 72, 94, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
}

.slug-input:focus-within {
  border-color: #ed78a5;
  box-shadow: 0 0 0 3px rgba(237, 120, 165, 0.15);
}

.slug-input-prefix {
  padding: 0 4px 0 13px;
  color: #c13f78;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.slug-input input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 11px 13px 11px 2px;
  box-shadow: none;
}

.slug-input input:focus {
  border-color: transparent;
  box-shadow: none;
}

.album-cover-field {
  display: flex;
  align-items: center;
  gap: 14px;
}

.album-cover-field label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  font-weight: 700;
}

.album-cover-field input[type='file'] {
  max-width: 170px;
  font-size: 12px;
}

.album-cover-preview {
  width: 64px;
  height: 64px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 6px 16px rgba(93, 54, 70, 0.16);
}

.toast {
  position: fixed;
  top: 18px;
  right: 24px;
  z-index: 4000;
  max-width: 360px;
  padding: 12px 18px;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
}

.toast.is-success {
  background: rgba(46, 160, 67, 0.94);
}

.toast.is-error {
  background: rgba(220, 53, 69, 0.94);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.metadata-list-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.metadata-search {
  flex: 0 0 auto;
}

.metadata-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.metadata-pager button {
  border: 1px solid rgba(112, 72, 94, 0.16);
  border-radius: 10px;
  padding: 7px 14px;
  background: rgba(255, 240, 246, 0.9);
  color: #6c3d55;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
}

.metadata-pager button:hover:not(:disabled) {
  border-color: #ed78a5;
}

.metadata-pager button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.metadata-pager span {
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  font-weight: 800;
}

.metadata-pane > .compact-form.playlist-form {
  height: auto;
  max-height: 720px;
  overflow-y: auto;
  align-content: start;
}

.publish-check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  font-weight: 700;
}

.publish-check input[type='checkbox'],
.playlist-song-pick-item input[type='checkbox'] {
  width: auto;
  flex: 0 0 auto;
  accent-color: #ff699d;
}

.playlist-selected {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(112, 72, 94, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.55);
}

.playlist-selected-head {
  color: var(--text-secondary, #6b7280);
  font-size: 12px;
  font-weight: 800;
}

.playlist-selected-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 2px;
}

.playlist-selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.playlist-selected-index {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 105, 157, 0.15);
  color: var(--brand-strong, #e94e77);
  font-size: 11px;
  font-weight: 800;
}

.playlist-selected-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-selected-item small {
  flex: 0 0 auto;
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
}

.playlist-selected-item button {
  flex: 0 0 auto;
  padding: 2px 6px;
  border: none;
  background: transparent;
  color: var(--brand-strong, #e94e77);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.playlist-selected-empty {
  margin: 0;
  padding: 10px 0;
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
  text-align: center;
}

.playlist-song-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(112, 72, 94, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.45);
}

.playlist-song-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.playlist-song-picker-head strong {
  flex: 0 0 auto;
  font-size: 13px;
}

.playlist-song-search {
  display: flex;
  flex: 1 1 auto;
  gap: 6px;
  min-width: 0;
}

.playlist-song-search input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 8px 11px;
  font-size: 13px;
}

.playlist-song-search button {
  flex: 0 0 auto;
  border: 1px solid rgba(112, 72, 94, 0.16);
  border-radius: 10px;
  padding: 8px 14px;
  background: rgba(255, 240, 246, 0.9);
  color: #6c3d55;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
}

.playlist-song-picker-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 2px;
}

.playlist-song-pick-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.playlist-song-pick-item:hover {
  background: rgba(255, 105, 157, 0.08);
}

.playlist-song-pick-item.active {
  background: rgba(255, 105, 157, 0.14);
}

.playlist-song-pick-item span {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-song-pick-item small {
  flex: 0 0 auto;
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
}

@media (max-width: 900px) {
  .metadata-pane {
    grid-template-columns: 1fr;
  }

  .category-pane-body {
    grid-template-columns: 1fr;
  }

  .metadata-pane > .compact-form,
  .category-pane-body > .compact-form {
    height: auto;
  }
}
</style>
