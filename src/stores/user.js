import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { loadJSON, saveJSON, removeStorage, hashPassword } from '../utils/storage'

export const DEFAULT_AVATAR = '/assets/imgs/default-avatar.svg'

function sanitizeUser(user) {
  if (!user) return null
  const { passwordHash, ...safeUser } = user
  return {
    ...safeUser,
    avatarUrl: safeUser.avatarUrl || DEFAULT_AVATAR,
    authProvider: safeUser.authProvider || 'password'
  }
}

function dataKey(base, userId) {
  return userId ? `${base}:${userId}` : null
}

function normalizeHistory(history) {
  return (Array.isArray(history) ? history : [])
    .map((item) => {
      if (typeof item === 'string') return { id: item, time: 0 }
      return { id: item?.id, time: item?.time || 0 }
    })
    .filter((item) => item.id)
}

function normalizeCustomPlaylists(playlists) {
  return (Array.isArray(playlists) ? playlists : [])
    .map((playlist) => ({
      id: String(playlist?.id || ''),
      name: String(playlist?.name || '').trim(),
      songIds: [...new Set(Array.isArray(playlist?.songIds) ? playlist.songIds : [])],
      createdAt: playlist?.createdAt || Date.now(),
      updatedAt: playlist?.updatedAt || playlist?.createdAt || Date.now()
    }))
    .filter((playlist) => playlist.id && playlist.name)
}

function loadUserData(userId) {
  if (!userId) {
    return { favoriteSongs: [], favoritePlaylists: [], playHistory: [], customPlaylists: [] }
  }

  return {
    favoriteSongs: loadJSON(dataKey('favorite-songs', userId), []),
    favoritePlaylists: loadJSON(dataKey('favorite-playlists', userId), []),
    playHistory: normalizeHistory(loadJSON(dataKey('play-history', userId), [])),
    customPlaylists: normalizeCustomPlaylists(loadJSON(dataKey('custom-playlists', userId), []))
  }
}

export const useUserStore = defineStore('user', () => {
  const users = ref(loadJSON('users', []))
  const currentUser = ref(sanitizeUser(loadJSON('session', null)))
  const initialData = loadUserData(currentUser.value?.id)

  const favoriteSongs = ref(initialData.favoriteSongs)
  const favoritePlaylists = ref(initialData.favoritePlaylists)
  const playHistory = ref(initialData.playHistory)
  const customPlaylists = ref(initialData.customPlaylists)

  const isLoggedIn = computed(() => Boolean(currentUser.value))

  watch(users, (value) => saveJSON('users', value), { deep: true })
  watch(currentUser, (value) => saveJSON('session', sanitizeUser(value)), { deep: true })

  watch(currentUser, (value) => {
    const data = loadUserData(value?.id)
    favoriteSongs.value = data.favoriteSongs
    favoritePlaylists.value = data.favoritePlaylists
    playHistory.value = data.playHistory
    customPlaylists.value = data.customPlaylists
  })

  watch(
    favoriteSongs,
    (value) => {
      const key = dataKey('favorite-songs', currentUser.value?.id)
      if (key) saveJSON(key, value)
    },
    { deep: true }
  )

  watch(
    favoritePlaylists,
    (value) => {
      const key = dataKey('favorite-playlists', currentUser.value?.id)
      if (key) saveJSON(key, value)
    },
    { deep: true }
  )

  watch(
    playHistory,
    (value) => {
      const key = dataKey('play-history', currentUser.value?.id)
      if (key) saveJSON(key, value)
    },
    { deep: true }
  )

  watch(
    customPlaylists,
    (value) => {
      const key = dataKey('custom-playlists', currentUser.value?.id)
      if (key) saveJSON(key, value)
    },
    { deep: true }
  )

  function findUser(account) {
    return users.value.find((user) => user.username === account || user.email === account)
  }

  function register({ username, email, password, confirmPassword }) {
    const name = username.trim()
    const mail = email.trim().toLowerCase()

    if (!name || !mail || !password) {
      return { ok: false, message: '请填写完整的注册信息' }
    }

    if (name.length < 2 || name.length > 20) {
      return { ok: false, message: '用户名长度需在 2-20 个字符之间' }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      return { ok: false, message: '请输入有效的邮箱地址' }
    }

    if (password.length < 6) {
      return { ok: false, message: '密码长度不能少于 6 位' }
    }

    if (password !== confirmPassword) {
      return { ok: false, message: '两次输入的密码不一致' }
    }

    if (findUser(name) || findUser(mail)) {
      return { ok: false, message: '用户名或邮箱已被注册' }
    }

    const user = {
      id: `u${Date.now()}`,
      username: name,
      email: mail,
      passwordHash: hashPassword(password),
      avatarUrl: DEFAULT_AVATAR,
      authProvider: 'password',
      createdAt: new Date().toISOString()
    }

    users.value.push(user)
    return { ok: true, message: '注册成功，请登录' }
  }

  function login({ account, password }) {
    const value = account.trim()
    const user = findUser(value)

    if (!user) {
      return { ok: false, message: '用户不存在，请先注册' }
    }

    if (user.passwordHash !== hashPassword(password)) {
      return { ok: false, message: '用户名或密码错误' }
    }

    currentUser.value = sanitizeUser(user)
    return { ok: true, message: '登录成功' }
  }

  function logout() {
    currentUser.value = null
    removeStorage('session')
  }

  function isFavoriteSong(songId) {
    return favoriteSongs.value.includes(songId)
  }

  function toggleFavoriteSong(songId) {
    if (!isLoggedIn.value) return false

    const index = favoriteSongs.value.indexOf(songId)
    if (index >= 0) {
      favoriteSongs.value.splice(index, 1)
      return false
    }

    favoriteSongs.value.unshift(songId)
    return true
  }

  function isFavoritePlaylist(playlistId) {
    return favoritePlaylists.value.includes(playlistId)
  }

  function toggleFavoritePlaylist(playlistId) {
    if (!isLoggedIn.value) return false

    const index = favoritePlaylists.value.indexOf(playlistId)
    if (index >= 0) {
      favoritePlaylists.value.splice(index, 1)
      return false
    }

    favoritePlaylists.value.unshift(playlistId)
    return true
  }

  function recordPlay(songId) {
    if (!isLoggedIn.value) return

    const nextHistory = [
      { id: songId, time: Date.now() },
      ...playHistory.value.filter((item) => item.id !== songId)
    ]
    playHistory.value = nextHistory.slice(0, 50)
  }

  function clearPlayHistory() {
    playHistory.value = []
  }

  function createCustomPlaylist(name, songId = null) {
    if (!isLoggedIn.value) return { ok: false, message: '请先登录后创建歌单' }

    const title = String(name || '').trim()
    if (!title) return { ok: false, message: '请输入歌单名称' }
    if (title.length > 30) return { ok: false, message: '歌单名称不能超过 30 个字符' }
    if (
      customPlaylists.value.some((playlist) => playlist.name.toLowerCase() === title.toLowerCase())
    ) {
      return { ok: false, message: '已存在同名歌单' }
    }

    const now = Date.now()
    const playlist = {
      id: `custom-${now}-${Math.random().toString(36).slice(2, 8)}`,
      name: title,
      songIds: songId ? [songId] : [],
      createdAt: now,
      updatedAt: now
    }
    customPlaylists.value.unshift(playlist)
    return { ok: true, playlist, message: songId ? '歌单已创建并添加歌曲' : '歌单创建成功' }
  }

  function addSongToCustomPlaylist(playlistId, songId) {
    if (!isLoggedIn.value) return { ok: false, message: '请先登录后添加歌曲' }

    const playlist = customPlaylists.value.find((item) => item.id === playlistId)
    if (!playlist) return { ok: false, message: '歌单不存在' }

    const existed = playlist.songIds.includes(songId)
    if (existed) {
      return {
        ok: false,
        duplicate: true,
        message: `歌曲已在「${playlist.name}」歌单中`
      }
    }

    playlist.songIds = [...playlist.songIds, songId]
    playlist.updatedAt = Date.now()
    return {
      ok: true,
      added: true,
      message: `已添加到「${playlist.name}」`
    }
  }

  function updateAvatar(avatarUrl) {
    if (!isLoggedIn.value) return { ok: false, message: '请先登录后修改头像' }
    if (currentUser.value.authProvider !== 'password') {
      return { ok: false, message: '第三方登录账号暂不支持修改头像' }
    }
    if (!String(avatarUrl || '').startsWith('data:image/webp;base64,')) {
      return { ok: false, message: '头像仅支持 WebP 图片' }
    }

    const userIndex = users.value.findIndex((user) => user.id === currentUser.value.id)
    if (userIndex < 0) return { ok: false, message: '未找到当前用户信息' }

    const updatedUser = { ...users.value[userIndex], avatarUrl }
    users.value[userIndex] = updatedUser
    currentUser.value = sanitizeUser(updatedUser)
    return { ok: true, message: '头像修改成功' }
  }

  function changePassword({ currentPassword, newPassword, confirmPassword }) {
    if (!isLoggedIn.value) return { ok: false, message: '请先登录后修改密码' }
    if (currentUser.value.authProvider !== 'password') {
      return { ok: false, message: '第三方登录账号暂不支持修改密码' }
    }

    const userIndex = users.value.findIndex((user) => user.id === currentUser.value.id)
    if (userIndex < 0) return { ok: false, message: '未找到当前用户信息' }
    if (users.value[userIndex].passwordHash !== hashPassword(currentPassword)) {
      return { ok: false, message: '当前密码不正确' }
    }
    if (newPassword.length < 6) {
      return { ok: false, message: '新密码长度不能少于 6 位' }
    }
    if (newPassword === currentPassword) {
      return { ok: false, message: '新密码不能与当前密码相同' }
    }
    if (newPassword !== confirmPassword) {
      return { ok: false, message: '两次输入的新密码不一致' }
    }

    users.value[userIndex] = {
      ...users.value[userIndex],
      passwordHash: hashPassword(newPassword)
    }
    return { ok: true, message: '密码修改成功' }
  }

  function removeSongFromCustomPlaylist(playlistId, songId) {
    const playlist = customPlaylists.value.find((item) => item.id === playlistId)
    if (!playlist) return false
    playlist.songIds = playlist.songIds.filter((id) => id !== songId)
    playlist.updatedAt = Date.now()
    return true
  }

  function deleteCustomPlaylist(playlistId) {
    const index = customPlaylists.value.findIndex((item) => item.id === playlistId)
    if (index < 0) return false
    customPlaylists.value.splice(index, 1)
    return true
  }

  function syncSession() {
    currentUser.value = sanitizeUser(loadJSON('session', null))
  }

  return {
    users,
    currentUser,
    favoriteSongs,
    favoritePlaylists,
    playHistory,
    customPlaylists,
    isLoggedIn,
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
    updateAvatar,
    changePassword,
    removeSongFromCustomPlaylist,
    deleteCustomPlaylist,
    syncSession
  }
})
