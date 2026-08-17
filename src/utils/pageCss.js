import { onBeforeMount, onUnmounted } from 'vue'

export function usePageCss(hrefs) {
  const links = []

  onBeforeMount(() => {
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
