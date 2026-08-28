function safeRedirect(value) {
  const redirect = String(value || '/')
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
}

export function openAuthWindow(router, target = 'login', redirect = '/') {
  const route = router.resolve({
    name: target,
    query: { popup: '1', redirect: safeRedirect(redirect) }
  })
  const width = 460
  const height = 700
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)
  const authWindow = window.open(
    route.href,
    `yueyin-${target}`,
    `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`
  )

  if (!authWindow) {
    router.push({ name: target, query: { redirect: safeRedirect(redirect) } })
    return false
  }

  authWindow.focus()
  return true
}

export function finishAuth(router, route) {
  const redirect = safeRedirect(route.query.redirect)

  if (route.query.popup === '1' && window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: 'music-site:auth-success', redirect }, window.location.origin)
    window.close()
    window.setTimeout(() => {
      if (!window.closed) router.replace(redirect)
    }, 120)
    return
  }

  router.replace(redirect)
}

export function authRouteQuery(route, extra = {}) {
  return {
    ...extra,
    ...(route.query.popup === '1' ? { popup: '1' } : {}),
    ...(route.query.redirect ? { redirect: safeRedirect(route.query.redirect) } : {})
  }
}
