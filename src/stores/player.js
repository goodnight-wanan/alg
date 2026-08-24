import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from './user'

const audio = new Audio()

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'

  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export const usePlayerStore = defineStore('player', () => {
  const queue = ref([])
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const isMuted = ref(false)
  const mode = ref('order')

  const currentSong = computed(() => queue.value[currentIndex.value] || null)
  const progress = computed(() => {
    if (!duration.value) return 0
    return currentTime.value / duration.value
  })
  const currentTimeText = computed(() => formatTime(currentTime.value))
  const durationText = computed(() => formatTime(duration.value))

  watch(currentSong, (song) => {
    if (!song?.id) return
    useUserStore().recordPlay(song.id)
  })

  function syncVolume() {
    audio.volume = isMuted.value ? 0 : volume.value
  }

  function play() {
    audio.play().catch((error) => {
      console.warn('播放失败', error)
      isPlaying.value = false
    })
  }

  function pause() {
    audio.pause()
  }

  function playSong(song, playQueue = null) {
    if (!song) return

    if (currentSong.value?.id === song.id) {
      if (audio.paused) {
        play()
      } else {
        pause()
      }
      return
    }

    const list = playQueue?.length ? playQueue : queue.value
    const nextIndex = list.findIndex((item) => item.id === song.id)

    if (list !== queue.value) {
      queue.value = [...list]
      currentIndex.value = nextIndex >= 0 ? nextIndex : 0
    } else if (nextIndex >= 0) {
      currentIndex.value = nextIndex
    }

    audio.src = currentSong.value?.audio || ''
    play()
  }

  function isListActive(list) {
    if (!list?.length || !queue.value.length) return false

    return (
      queue.value.length === list.length &&
      queue.value.every((item, index) => item.id === list[index].id)
    )
  }

  function playAll(list) {
    if (!list?.length) return

    if (isListActive(list)) {
      if (audio.paused) {
        play()
      } else {
        pause()
      }
      return
    }

    playSong(list[0], list)
  }

  function togglePlay() {
    if (!currentSong.value) return

    if (audio.paused) {
      play()
    } else {
      pause()
    }
  }

  function next() {
    if (!queue.value.length) return

    if (mode.value === 'shuffle') {
      let nextIndex = currentIndex.value
      while (nextIndex === currentIndex.value && queue.value.length > 1) {
        nextIndex = Math.floor(Math.random() * queue.value.length)
      }
      currentIndex.value = nextIndex
    } else {
      const nextIndex = currentIndex.value + 1
      if (nextIndex >= queue.value.length) {
        if (mode.value === 'order') {
          audio.pause()
          isPlaying.value = false
          return
        }
        currentIndex.value = 0
      } else {
        currentIndex.value = nextIndex
      }
    }

    audio.src = currentSong.value?.audio || ''
    play()
  }

  function previous() {
    if (!queue.value.length) return

    if (audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }

    if (mode.value === 'shuffle') {
      let nextIndex = currentIndex.value
      while (nextIndex === currentIndex.value && queue.value.length > 1) {
        nextIndex = Math.floor(Math.random() * queue.value.length)
      }
      currentIndex.value = nextIndex
    } else {
      currentIndex.value =
        currentIndex.value <= 0 ? queue.value.length - 1 : currentIndex.value - 1
    }

    audio.src = currentSong.value?.audio || ''
    play()
  }

  function playAt(index) {
    if (!queue.value.length || index < 0 || index >= queue.value.length) return
    currentIndex.value = index
    audio.src = currentSong.value?.audio || ''
    play()
  }

  function seekRatio(ratio) {
    if (!duration.value) return
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * duration.value
  }

  function seek(seconds) {
    if (!duration.value) return
    audio.currentTime = Math.min(Math.max(seconds, 0), duration.value)
  }

  function setVolume(value) {
    volume.value = Math.min(Math.max(value, 0), 1)
    syncVolume()
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    syncVolume()
  }

  function cycleMode() {
    const modes = ['order', 'list-loop', 'loop', 'shuffle']
    const index = modes.indexOf(mode.value)
    mode.value = modes[(index + 1) % modes.length]
  }

  function handleEnded() {
    if (!queue.value.length) {
      isPlaying.value = false
      return
    }

    if (mode.value === 'loop') {
      audio.currentTime = 0
      play()
      return
    }

    if (mode.value === 'order' && currentIndex.value >= queue.value.length - 1) {
      isPlaying.value = false
      audio.currentTime = 0
      return
    }

    if (mode.value === 'shuffle' && queue.value.length === 1) {
      isPlaying.value = false
      return
    }

    next()
  }

  audio.volume = volume.value
  audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime
  })
  audio.addEventListener('loadedmetadata', () => {
    duration.value = audio.duration
  })
  audio.addEventListener('play', () => {
    isPlaying.value = true
  })
  audio.addEventListener('pause', () => {
    isPlaying.value = false
  })
  audio.addEventListener('ended', handleEnded)
  audio.addEventListener('error', () => {
    isPlaying.value = false
  })

  return {
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    mode,
    currentSong,
    progress,
    currentTimeText,
    durationText,
    playSong,
    playAll,
    isListActive,
    togglePlay,
    next,
    previous,
    playAt,
    seekRatio,
    seek,
    setVolume,
    toggleMute,
    cycleMode,
    formatTime
  }
})
