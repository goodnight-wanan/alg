export function openAuthWindow(redirect = '/') {
  const base = window.location.href.split('#')[0]
  const url = `${base}#/login?redirect=${encodeURIComponent(redirect)}`
  window.open(url, '_blank')
}
