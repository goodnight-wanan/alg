import { onMounted, onUnmounted } from 'vue'

export function usePageCss(hrefs) {
  const links = []

  onMounted(() => {
    hrefs.forEach((href) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.dataset.pageCss = 'true'
      document.head.appendChild(link)
      links.push(link)
    })
  })

  onUnmounted(() => {
    links.forEach((link) => link.remove())
  })
}
