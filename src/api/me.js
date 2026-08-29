import { apiRequest } from './client'

export function fetchFavoriteSongs() {
  return apiRequest('/me/favorite-songs?page=1&pageSize=50')
}

export function addFavoriteSong(songId) {
  return apiRequest(`/me/favorite-songs/${encodeURIComponent(songId)}`, { method: 'POST' })
}

export function removeFavoriteSong(songId) {
  return apiRequest(`/me/favorite-songs/${encodeURIComponent(songId)}`, { method: 'DELETE' })
}

export function fetchFavoritePlaylists() {
  return apiRequest('/me/favorite-playlists?page=1&pageSize=50')
}

export function addFavoritePlaylist(playlistId) {
  return apiRequest(`/me/favorite-playlists/${encodeURIComponent(playlistId)}`, {
    method: 'POST'
  })
}

export function removeFavoritePlaylist(playlistId) {
  return apiRequest(`/me/favorite-playlists/${encodeURIComponent(playlistId)}`, {
    method: 'DELETE'
  })
}

export function fetchUserPlaylists() {
  return apiRequest('/me/playlists')
}

export function createUserPlaylist(payload) {
  return apiRequest('/me/playlists', { method: 'POST', body: payload })
}

export function updateUserPlaylist(playlistId, payload) {
  return apiRequest(`/me/playlists/${encodeURIComponent(playlistId)}`, {
    method: 'PATCH',
    body: payload
  })
}

export function deleteUserPlaylist(playlistId) {
  return apiRequest(`/me/playlists/${encodeURIComponent(playlistId)}`, { method: 'DELETE' })
}

export function addUserPlaylistSong(playlistId, songId) {
  return apiRequest(
    `/me/playlists/${encodeURIComponent(playlistId)}/songs/${encodeURIComponent(songId)}`,
    { method: 'POST' }
  )
}

export function removeUserPlaylistSong(playlistId, songId) {
  return apiRequest(
    `/me/playlists/${encodeURIComponent(playlistId)}/songs/${encodeURIComponent(songId)}`,
    { method: 'DELETE' }
  )
}

export function fetchPlayHistory() {
  return apiRequest('/me/history?page=1&pageSize=50')
}

export function recordPlayHistory(songId) {
  return apiRequest(`/me/history/${encodeURIComponent(songId)}`, { method: 'POST' })
}

export function clearPlayHistoryRequest() {
  return apiRequest('/me/history', { method: 'DELETE' })
}

export function updateProfile(payload) {
  return apiRequest('/me/profile', { method: 'PATCH', body: payload })
}

export function uploadAvatar(file) {
  const body = new FormData()
  body.append('avatar', file)
  return apiRequest('/me/avatar', { method: 'POST', body, timeoutMs: 30000 })
}

export function changePassword(payload) {
  return apiRequest('/me/password', { method: 'PATCH', body: payload })
}
