import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from './api'

export const ADMIN_SESSION_KEY = 'music-admin-session'

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY)) || null
  } catch {
    return null
  }
}

export const useAdminAuthStore = defineStore('admin-auth', () => {
  const session = ref(readSession())
  const isAuthenticated = computed(
    () => session.value?.user?.role === 'ADMIN' && Boolean(session.value?.accessToken)
  )

  function persist(nextSession) {
    session.value = nextSession
    if (nextSession) localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextSession))
    else localStorage.removeItem(ADMIN_SESSION_KEY)
  }

  function updateTokens(tokens) {
    persist({
      ...session.value,
      user: tokens.user || session.value?.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    })
  }

  async function login(account, password) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ account, password })
    })
    if (result.user.role !== 'ADMIN') {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: result.refreshToken })
      }).catch(() => undefined)
      throw new Error('当前账号不是管理员')
    }
    persist(result)
  }

  async function logout() {
    const refreshToken = session.value?.refreshToken
    persist(null)
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      }).catch(() => undefined)
    }
  }

  async function request(path, options = {}) {
    try {
      return await apiRequest(path, {
        ...options,
        accessToken: session.value?.accessToken,
        refreshToken: session.value?.refreshToken,
        onTokens: updateTokens
      })
    } catch (error) {
      if (error.status === 401) persist(null)
      throw error
    }
  }

  return { session, isAuthenticated, login, logout, request }
})
