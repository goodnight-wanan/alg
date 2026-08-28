import { ref } from 'vue'
import { loadJSON, saveJSON } from './storage'

const HISTORY_KEY = 'search-history'
const searchHistory = ref(loadJSON(HISTORY_KEY, []))

export function useSearchHistory() {
  return searchHistory
}

export function addSearchHistory(term) {
  const value = String(term || '').trim()
  if (!value) return

  searchHistory.value = [value, ...searchHistory.value.filter((item) => item !== value)].slice(0, 10)
  saveJSON(HISTORY_KEY, searchHistory.value)
}

export function clearSearchHistory() {
  searchHistory.value = []
  saveJSON(HISTORY_KEY, [])
}
