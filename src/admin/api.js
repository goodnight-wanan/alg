export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
).replace(/\/$/, '')

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join('；')
      : payload?.message || `请求失败（${response.status}）`
    const error = new Error(message)
    error.status = response.status
    error.code = payload?.code
    throw error
  }
  return payload
}

export async function apiRequest(path, options = {}) {
  const { accessToken, refreshToken, onTokens, ...requestOptions } = options
  const headers = new Headers(requestOptions.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (requestOptions.body && !(requestOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  let response = await fetch(`${API_BASE_URL}${path}`, { ...requestOptions, headers })
  if (response.status === 401 && accessToken && refreshToken) {
    const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
    const tokens = await parseResponse(refreshed)
    onTokens?.(tokens)
    headers.set('Authorization', `Bearer ${tokens.accessToken}`)
    response = await fetch(`${API_BASE_URL}${path}`, { ...requestOptions, headers })
  }
  return parseResponse(response)
}
