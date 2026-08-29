import {
  apiRequest,
  clearAuthSession,
  getStoredAuthSession,
  saveAuthSession
} from './client'

export async function registerAccount(payload) {
  const session = await apiRequest('/auth/register', {
    method: 'POST',
    body: payload,
    auth: false
  })
  saveAuthSession(session)
  return session
}

export async function loginAccount(payload) {
  const session = await apiRequest('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false
  })
  saveAuthSession(session)
  return session
}

export async function fetchCurrentUser() {
  return apiRequest('/me')
}

export async function logoutAccount() {
  const refreshToken = getStoredAuthSession()?.refreshToken
  if (refreshToken) {
    await apiRequest('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      auth: false
    })
  }
  clearAuthSession()
}
