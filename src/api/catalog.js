import { API_BASE_URL } from './client'

export { API_BASE_URL }

function createTimeoutSignal(timeoutMs = 12000) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  return { signal: controller.signal, clear: () => window.clearTimeout(timeout) }
}

async function request(path) {
  const timeout = createTimeoutSignal()
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: timeout.signal
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(body?.message || `请求失败（${response.status}）`)
    }
    return body
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('曲库请求超时，请稍后重试')
    throw error instanceof Error ? error : new Error('曲库请求失败')
  } finally {
    timeout.clear()
  }
}

export function resolveApiResourceUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const base = new URL(API_BASE_URL, window.location.origin)
  return new URL(value, base.origin).toString()
}

export async function fetchCatalogBundle() {
  const [songResponse, playlists, artists, albums, categories] = await Promise.all([
    request('/songs?page=1&pageSize=50'),
    request('/playlists'),
    request('/artists'),
    request('/albums'),
    request('/categories')
  ])

  return {
    songs: Array.isArray(songResponse?.items) ? songResponse.items : [],
    playlists: Array.isArray(playlists) ? playlists : [],
    artists: Array.isArray(artists) ? artists : [],
    albums: Array.isArray(albums) ? albums : [],
    categories: Array.isArray(categories) ? categories : []
  }
}
