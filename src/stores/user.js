import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { loadJSON, saveJSON, removeStorage, hashPassword } from '../utils/storage'

function sanitizeUser(user) {
  if (!user) return null
  const { passwordHash, ...safeUser } = user
  return safeUser
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

function loadUserData(userId) {
  if (!userId) {
    return { favoriteSongs: [], favoritePlaylists: [], playHistory: [] }
  }

  return {
    favoriteSongs: loadJSON(dataKey('favorite-songs', userId), []),
    favoritePlaylists: loadJSON(dataKey('favorite-playlists', userId), []),
    playHistory: normalizeHistory(loadJSON(dataKey('play-history', userId), []))
  }
}

export const useUserStore = defineStore('user', () => {
  const users = ref(loadJSON('users', []))
  const currentUser = ref(sanitizeUser(loadJSON('session', null)))
  const initialData = loadUserData(currentUser.value?.id)

  const favoriteSongs = ref(initialData.favoriteSongs)
  const favoritePlaylists = ref(initialData.favoritePlaylists)
  const playHistory = ref(initialData.playHistory)

  const isLoggedIn = computed(() => Boolean(currentUser.value))

  watch(users, (value) => saveJSON('users', value), { deep: true })
  watch(currentUser, (value) => saveJSON('session', sanitizeUser(value)), { deep: true })

  watch(currentUser, (value) => {
    const data = loadUserData(value?.id)
    favoriteSongs.value = data.favoriteSongs
    favoritePlaylists.value = data.favoritePlaylists
    playHistory.value = data.playHistory
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

  function syncSession() {
    currentUser.value = sanitizeUser(loadJSON('session', null))
  }

  return {
    users,
    currentUser,
    favoriteSongs,
    favoritePlaylists,
    playHistory,
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
    syncSession
  }
})
