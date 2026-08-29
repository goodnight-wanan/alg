import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount
} from '../api/auth'
import {
  AUTH_EXPIRED_EVENT,
  clearAuthSession,
  getStoredAuthSession,
  saveAuthSession
} from '../api/client'
import { resolveApiResourceUrl } from '../api/catalog'
import {
  addFavoritePlaylist,
  addFavoriteSong,
  addUserPlaylistSong,
  changePassword as changePasswordRequest,
  clearPlayHistoryRequest,
  createUserPlaylist,
  deleteUserPlaylist,
  fetchFavoritePlaylists,
  fetchFavoriteSongs,
  fetchPlayHistory,
  fetchUserPlaylists,
  recordPlayHistory,
  removeFavoritePlaylist,
  removeFavoriteSong,
  removeUserPlaylistSong,
  updateProfile,
  updateUserPlaylist,
  uploadAvatar
} from '../api/me'

export const DEFAULT_AVATAR = '/assets/imgs/default-avatar.svg'

function normalizeUser(user) {
  if (!user) return null
  return {
    ...user,
    avatarUrl: resolveApiResourceUrl(user.avatarUrl) || DEFAULT_AVATAR,
    authProvider: 'password'
  }
}

function normalizePlaylist(playlist) {
  return {
    id: playlist.id,
    publicId: playlist.publicId,
    name: playlist.title,
    description: playlist.description || '',
    songIds: (playlist.songs || []).map((song) => song.publicId).filter(Boolean),
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt
  }
}

function errorMessage(error, fallback) {
  return error?.message || fallback
}

export const useUserStore = defineStore('user', () => {
  const storedSession = getStoredAuthSession()
  const currentUser = ref(normalizeUser(storedSession?.user))
  const hasSession = ref(Boolean(storedSession?.accessToken && storedSession?.refreshToken))
  const favoriteSongs = ref([])
  const favoritePlaylists = ref([])
  const playHistory = ref([])
  const customPlaylists = ref([])
  const initialized = ref(false)
  const loading = ref(false)
  const dataLoading = ref(false)
  const error = ref('')
  let pendingInitialization = null

  const isLoggedIn = computed(() => Boolean(currentUser.value && hasSession.value))

  function setSession(session) {
    saveAuthSession(session)
    currentUser.value = normalizeUser(session.user)
    hasSession.value = Boolean(session.accessToken && session.refreshToken)
  }

  function resetUserData() {
    favoriteSongs.value = []
    favoritePlaylists.value = []
    playHistory.value = []
    customPlaylists.value = []
  }

  function clearSession() {
    clearAuthSession()
    currentUser.value = null
    hasSession.value = false
    resetUserData()
  }

  async function loadLibrary() {
    if (!isLoggedIn.value) {
      resetUserData()
      return false
    }

    dataLoading.value = true
    error.value = ''
    try {
      const [songFavorites, playlistFavorites, history, playlists] = await Promise.all([
        fetchFavoriteSongs(),
        fetchFavoritePlaylists(),
        fetchPlayHistory(),
        fetchUserPlaylists()
      ])
      favoriteSongs.value = (songFavorites.items || []).map((song) => song.publicId)
      favoritePlaylists.value = (playlistFavorites.items || []).map(
        (playlist) => playlist.publicId
      )
      playHistory.value = (history.items || []).map((item) => ({
        id: item.song.publicId,
        time: new Date(item.lastPlayedAt).getTime(),
        playCount: item.playCount
      }))
      customPlaylists.value = (playlists || []).map(normalizePlaylist)
      return true
    } catch (requestError) {
      error.value = errorMessage(requestError, '用户数据加载失败，请稍后重试')
      return false
    } finally {
      dataLoading.value = false
    }
  }

  async function initialize({ force = false } = {}) {
    if (pendingInitialization) return pendingInitialization
    if (initialized.value && !force) return isLoggedIn.value

    pendingInitialization = (async () => {
      // Defer the body so the assignment above finishes first. Otherwise a
      // synchronously settled run (e.g. no stored session) would reset this
      // flag in the finally block below and then be overwritten by the
      // assignment, leaving a stale promise that blocks every later call.
      await Promise.resolve()
      try {
        const session = getStoredAuthSession()
        if (!session?.accessToken || !session?.refreshToken) {
          clearSession()
          initialized.value = true
          return false
        }

        loading.value = true
        hasSession.value = true
        currentUser.value = normalizeUser(session.user)
        const response = await fetchCurrentUser()
        const refreshedSession = getStoredAuthSession() || session
        setSession({ ...refreshedSession, user: response.user })
        await loadLibrary()
        initialized.value = true
        return true
      } catch (requestError) {
        clearSession()
        error.value = errorMessage(requestError, '登录状态已失效，请重新登录')
        initialized.value = true
        return false
      } finally {
        loading.value = false
        pendingInitialization = null
      }
    })()

    return pendingInitialization
  }

  async function register({ username, email, password, confirmPassword }) {
    if (password !== confirmPassword) {
      return { ok: false, message: '两次输入的密码不一致' }
    }
    try {
      const session = await registerAccount({ username, email, password })
      setSession(session)
      await loadLibrary()
      initialized.value = true
      return { ok: true, message: '注册成功' }
    } catch (requestError) {
      return { ok: false, message: errorMessage(requestError, '注册失败，请稍后重试') }
    }
  }

  async function login({ account, password }) {
    try {
      const session = await loginAccount({ account, password })
      setSession(session)
      await loadLibrary()
      initialized.value = true
      return { ok: true, message: '登录成功' }
    } catch (requestError) {
      return { ok: false, message: errorMessage(requestError, '登录失败，请稍后重试') }
    }
  }

  async function logout() {
    try {
      await logoutAccount()
    } catch (requestError) {
      console.warn('服务端退出失败，已清理本地登录状态', requestError)
    } finally {
      clearSession()
      initialized.value = true
    }
  }

  function isFavoriteSong(songId) {
    return favoriteSongs.value.includes(songId)
  }

  async function toggleFavoriteSong(songId) {
    if (!isLoggedIn.value) return { ok: false, message: '请先登录后再收藏' }
    const wasFavorite = isFavoriteSong(songId)
    favoriteSongs.value = wasFavorite
      ? favoriteSongs.value.filter((id) => id !== songId)
      : [songId, ...favoriteSongs.value]
    try {
      if (wasFavorite) await removeFavoriteSong(songId)
      else await addFavoriteSong(songId)
      return { ok: true, added: !wasFavorite }
    } catch (requestError) {
      favoriteSongs.value = wasFavorite
        ? [songId, ...favoriteSongs.value.filter((id) => id !== songId)]
        : favoriteSongs.value.filter((id) => id !== songId)
      return {
        ok: false,
        added: wasFavorite,
        message: errorMessage(requestError, '收藏操作失败，请重试')
      }
    }
  }

  function isFavoritePlaylist(playlistId) {
    return favoritePlaylists.value.includes(playlistId)
  }

  async function toggleFavoritePlaylist(playlistId) {
    if (!isLoggedIn.value) return { ok: false, message: '请先登录后再收藏' }
    const wasFavorite = isFavoritePlaylist(playlistId)
    favoritePlaylists.value = wasFavorite
      ? favoritePlaylists.value.filter((id) => id !== playlistId)
      : [playlistId, ...favoritePlaylists.value]
    try {
      if (wasFavorite) await removeFavoritePlaylist(playlistId)
      else await addFavoritePlaylist(playlistId)
      return { ok: true, added: !wasFavorite }
    } catch (requestError) {
      favoritePlaylists.value = wasFavorite
        ? [playlistId, ...favoritePlaylists.value.filter((id) => id !== playlistId)]
        : favoritePlaylists.value.filter((id) => id !== playlistId)
      return {
        ok: false,
        added: wasFavorite,
        message: errorMessage(requestError, '收藏操作失败，请重试')
      }
    }
  }

  function recordPlay(songId) {
    if (!isLoggedIn.value) return
    const existing = playHistory.value.find((item) => item.id === songId)
    playHistory.value = [
      {
        id: songId,
        time: Date.now(),
        playCount: (existing?.playCount || 0) + 1
      },
      ...playHistory.value.filter((item) => item.id !== songId)
    ].slice(0, 50)
    void recordPlayHistory(songId).catch((requestError) => {
      error.value = errorMessage(requestError, '播放记录同步失败')
    })
  }

  async function clearPlayHistory() {
    const previous = playHistory.value
    playHistory.value = []
    try {
      await clearPlayHistoryRequest()
      return { ok: true, message: '播放记录已清空' }
    } catch (requestError) {
      playHistory.value = previous
      return { ok: false, message: errorMessage(requestError, '清空播放记录失败') }
    }
  }

  async function createCustomPlaylist(name, songId = null) {
    if (!isLoggedIn.value) return { ok: false, message: '请先登录后创建歌单' }
    try {
      const playlist = await createUserPlaylist({
        title: String(name || '').trim(),
        ...(songId ? { songId } : {})
      })
      const normalized = normalizePlaylist(playlist)
      customPlaylists.value.unshift(normalized)
      return {
        ok: true,
        playlist: normalized,
        message: songId ? '歌单已创建并添加歌曲' : '歌单创建成功'
      }
    } catch (requestError) {
      return { ok: false, message: errorMessage(requestError, '歌单创建失败') }
    }
  }

  async function addSongToCustomPlaylist(playlistId, songId) {
    if (!isLoggedIn.value) return { ok: false, message: '请先登录后添加歌曲' }
    const playlist = customPlaylists.value.find((item) => item.id === playlistId)
    if (!playlist) return { ok: false, message: '歌单不存在' }
    if (playlist.songIds.includes(songId)) {
      return { ok: false, duplicate: true, message: `歌曲已在「${playlist.name}」歌单中` }
    }

    playlist.songIds = [...playlist.songIds, songId]
    playlist.updatedAt = new Date().toISOString()
    try {
      const result = await addUserPlaylistSong(playlistId, songId)
      if (result.duplicate) {
        return { ok: false, duplicate: true, message: `歌曲已在「${playlist.name}」歌单中` }
      }
      return { ok: true, added: true, message: `已添加到「${playlist.name}」` }
    } catch (requestError) {
      playlist.songIds = playlist.songIds.filter((id) => id !== songId)
      return { ok: false, message: errorMessage(requestError, '添加歌曲失败') }
    }
  }

  async function updateNickname(nickname) {
    try {
      const response = await updateProfile({ nickname })
      currentUser.value = normalizeUser(response.user)
      const session = getStoredAuthSession()
      if (session) saveAuthSession({ ...session, user: response.user })
      return { ok: true, message: '个人资料已更新' }
    } catch (requestError) {
      return { ok: false, message: errorMessage(requestError, '个人资料更新失败') }
    }
  }

  async function updateAvatar(file) {
    try {
      const response = await uploadAvatar(file)
      currentUser.value = normalizeUser(response.user)
      const session = getStoredAuthSession()
      if (session) saveAuthSession({ ...session, user: response.user })
      return { ok: true, message: '头像修改成功' }
    } catch (requestError) {
      return { ok: false, message: errorMessage(requestError, '头像上传失败') }
    }
  }

  async function changePassword({ currentPassword, newPassword, confirmPassword }) {
    if (newPassword !== confirmPassword) {
      return { ok: false, message: '两次输入的新密码不一致' }
    }
    try {
      const response = await changePasswordRequest({ currentPassword, newPassword })
      clearSession()
      return { ok: true, message: response.message || '密码修改成功，请重新登录' }
    } catch (requestError) {
      return { ok: false, message: errorMessage(requestError, '密码修改失败') }
    }
  }

  async function removeSongFromCustomPlaylist(playlistId, songId) {
    const playlist = customPlaylists.value.find((item) => item.id === playlistId)
    if (!playlist) return { ok: false, message: '歌单不存在' }
    const previousIds = playlist.songIds
    playlist.songIds = playlist.songIds.filter((id) => id !== songId)
    try {
      await removeUserPlaylistSong(playlistId, songId)
      return { ok: true, message: '已从歌单移除' }
    } catch (requestError) {
      playlist.songIds = previousIds
      return { ok: false, message: errorMessage(requestError, '移除歌曲失败') }
    }
  }

  async function deleteCustomPlaylist(playlistId) {
    const index = customPlaylists.value.findIndex((item) => item.id === playlistId)
    if (index < 0) return { ok: false, message: '歌单不存在' }
    const [removed] = customPlaylists.value.splice(index, 1)
    try {
      await deleteUserPlaylist(playlistId)
      return { ok: true, message: '歌单已删除' }
    } catch (requestError) {
      customPlaylists.value.splice(index, 0, removed)
      return { ok: false, message: errorMessage(requestError, '删除歌单失败') }
    }
  }

  async function updateCustomPlaylist(playlistId, name) {
    const playlist = customPlaylists.value.find((item) => item.id === playlistId)
    if (!playlist) return { ok: false, message: '歌单不存在' }
    const previousName = playlist.name
    playlist.name = String(name || '').trim()
    try {
      const updated = await updateUserPlaylist(playlistId, { title: playlist.name })
      Object.assign(playlist, normalizePlaylist(updated))
      return { ok: true, message: '歌单名称已更新' }
    } catch (requestError) {
      playlist.name = previousName
      return { ok: false, message: errorMessage(requestError, '歌单更新失败') }
    }
  }

  async function syncSession() {
    initialized.value = false
    return initialize({ force: true })
  }

  window.addEventListener(AUTH_EXPIRED_EVENT, () => {
    clearSession()
    initialized.value = true
  })

  return {
    currentUser,
    favoriteSongs,
    favoritePlaylists,
    playHistory,
    customPlaylists,
    initialized,
    loading,
    dataLoading,
    error,
    isLoggedIn,
    initialize,
    loadLibrary,
    register,
    login,
    logout,
    isFavoriteSong,
    toggleFavoriteSong,
    isFavoritePlaylist,
    toggleFavoritePlaylist,
    recordPlay,
    clearPlayHistory,
    createCustomPlaylist,
    addSongToCustomPlaylist,
    updateNickname,
    updateAvatar,
    changePassword,
    removeSongFromCustomPlaylist,
    updateCustomPlaylist,
    deleteCustomPlaylist,
    syncSession
  }
})
