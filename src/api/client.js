const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const AUTH_STORAGE_KEY = 'music-site:auth-session'

export const API_BASE_URL = configuredBaseUrl
export const AUTH_EXPIRED_EVENT = 'music-site:auth-expired'

export class ApiError extends Error {
  constructor(message, { status = 0, code = '', body = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.body = body
  }
}

export function getStoredAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAuthSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  return { signal: controller.signal, clear: () => window.clearTimeout(timeout) }
}

async function fetchJson(path, options = {}) {
  const timeout = createTimeoutSignal(options.timeoutMs || 12000)
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')
  let body = options.body

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body,
      signal: timeout.signal
    })
    const responseBody = await response.json().catch(() => null)
    if (!response.ok) {
      throw new ApiError(
        Array.isArray(responseBody?.message)
          ? responseBody.message[0]
          : responseBody?.message || `请求失败（${response.status}）`,
        {
          status: response.status,
          code: responseBody?.code || '',
          body: responseBody
        }
      )
    }
    return responseBody
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError(options.timeoutMessage || '请求超时，请稍后重试')
    }
    if (error instanceof ApiError) throw error
    throw new ApiError('无法连接服务器，请检查网络后重试')
  } finally {
    timeout.clear()
  }
}

let refreshRequest = null

async function refreshAuthSession() {
  if (refreshRequest) return refreshRequest
  const session = getStoredAuthSession()
  if (!session?.refreshToken) throw new ApiError('登录状态已失效', { status: 401 })

  refreshRequest = fetchJson('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: session.refreshToken }
  })
    .then((response) => {
      const nextSession = { ...session, ...response, user: response.user || session.user }
      saveAuthSession(nextSession)
      return nextSession
    })
    .catch((error) => {
      clearAuthSession()
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
      throw error
    })
    .finally(() => {
      refreshRequest = null
    })

  return refreshRequest
}

export async function apiRequest(path, options = {}) {
  const requiresAuth = options.auth !== false
  const session = getStoredAuthSession()
  const headers = new Headers(options.headers || {})
  if (requiresAuth && session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  try {
    return await fetchJson(path, { ...options, headers })
  } catch (error) {
    if (
      requiresAuth &&
      options.retry !== false &&
      error instanceof ApiError &&
      error.status === 401 &&
      session?.refreshToken
    ) {
      const refreshed = await refreshAuthSession()
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`)
      return fetchJson(path, { ...options, headers, retry: false })
    }
    throw error
  }
}
