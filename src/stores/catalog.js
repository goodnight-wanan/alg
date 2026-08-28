import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchCatalogBundle } from '../api/catalog'
import {
  albums,
  artists,
  categories,
  homePlaylistTabs,
  hydrateCatalog,
  playlists,
  songs
} from '../data/catalogData'

export const useCatalogStore = defineStore('catalog', () => {
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref('')
  let pendingRequest = null
  const hasData = computed(() => songs.length > 0)

  async function loadCatalog({ force = false } = {}) {
    if (pendingRequest) return pendingRequest
    if (initialized.value && !force) return true
    loading.value = true
    error.value = ''
    pendingRequest = fetchCatalogBundle()
      .then((bundle) => {
        hydrateCatalog(bundle)
        initialized.value = true
        return true
      })
      .catch((requestError) => {
        error.value = requestError?.message || '曲库加载失败，请稍后重试'
        return false
      })
      .finally(() => {
        loading.value = false
        pendingRequest = null
      })
    return pendingRequest
  }

  function retry() {
    return loadCatalog({ force: true })
  }

  return {
    songs,
    playlists,
    artists,
    albums,
    categories,
    homePlaylistTabs,
    loading,
    initialized,
    error,
    hasData,
    loadCatalog,
    retry
  }
})
