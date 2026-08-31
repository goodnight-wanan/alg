import { createRouter, createWebHistory } from 'vue-router'

const SESSION_KEY = 'music-admin-session'

function hasAdminSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    return session?.user?.role === 'ADMIN' && Boolean(session?.accessToken)
  } catch {
    return false
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../admin/views/AdminLoginView.vue'),
      meta: { title: '管理员登录' }
    },
    {
      path: '/',
      name: 'songs',
      component: () => import('../admin/views/AdminSongsView.vue'),
      meta: { title: '曲库管理', requiresAdmin: true }
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../admin/views/AdminUsersView.vue'),
      meta: { title: '用户管理', requiresAdmin: true }
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to) => {
  const isAdmin = hasAdminSession()
  if (to.meta.requiresAdmin && !isAdmin) return { name: 'login' }
  if (to.name === 'login' && isAdmin) return { name: 'songs' }
  document.title = `${to.meta.title || '管理后台'} - 悦音音乐`
  return true
})

export default router
