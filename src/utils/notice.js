import { ref } from 'vue'

const notice = ref('')
let timer = null

export function showNotice(message) {
  notice.value = message
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    notice.value = ''
  }, 2200)
}

export function useNotice() {
  return notice
}
