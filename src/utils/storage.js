const STORAGE_PREFIX = 'music-site:'

export function loadJSON(key, fallbackValue = null) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    return raw ? JSON.parse(raw) : fallbackValue
  } catch (error) {
    console.warn(`读取本地数据失败：${key}`, error)
    return fallbackValue
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    console.warn(`保存本地数据失败：${key}`, error)
  }
}

export function removeStorage(key) {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
}

export function hashPassword(password) {
  let hash = 0
  const salted = `music-website::${password}`

  for (let i = 0; i < salted.length; i += 1) {
    const char = salted.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }

  return `${salted.length}:${hash.toString(16)}`
}
