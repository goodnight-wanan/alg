import { ref } from 'vue'

const notice = ref(null)
let timer = null

export function showNotice(message, type = 'info') {
  notice.value = { message, type }
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    notice.value = null
  }, 2200)
}

export function useNotice() {
  return notice
}
